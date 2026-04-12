"use client";

import { useEffect, useRef, useState } from "react";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import {
  DEFAULT_CAROUSEL_SLIDE_COUNT,
  DEFAULT_CUSTOM_INSTRUCTIONS,
  PROGRESS_CAP
} from "@/components/create-post/constants";
import {
  clearCreatePostState,
  persistCreatePostState,
  restoreCreatePostState
} from "@/components/create-post/persistence";
import type {
  CarouselSlideContext,
  CreatePostPersistedState,
  DraftResponse,
  OutputLanguage,
  PostType,
  StoryCaptionMode,
  Tone
} from "@/components/create-post/types";
import {
  createSlideContexts,
  getClientGenerationTimeoutMs,
  normalizeSlideContexts
} from "@/components/create-post/utils";
import {
  generatePost as generatePostService,
  publishPost as publishPostService,
  schedulePost as schedulePostService
} from "@/services/frontend/posts";
import { saveGenerationSettings as saveGenerationSettingsService } from "@/services/frontend/user";

export function useCaptionGenerator(input: {
  initialOutputLanguage?: OutputLanguage;
  initialCustomInstructions?: string;
  dictionary: {
    common: { serverConnectionError: string; save: string };
    generator: {
      generateError: string;
      publishError: string;
      scheduleError: string;
      settingsSaveError: string;
      settingsSaved: string;
      scheduleTimeRequired: string;
      generationSlow: string;
      cancelGeneration: string;
      generationCanceled: string;
      clearGeneratedPost: string;
    };
  };
  onPublished: () => void;
  onScheduled: () => void;
}) {
  const defaultBrandColors = "#101828, #d62976, #feda75";
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [postType, setPostType] = useState<PostType>("feed");
  const [carouselSlideCount, setCarouselSlideCount] = useState(DEFAULT_CAROUSEL_SLIDE_COUNT);
  const [carouselSlideContexts, setCarouselSlideContexts] = useState<CarouselSlideContext[]>(
    createSlideContexts(DEFAULT_CAROUSEL_SLIDE_COUNT)
  );
  const [storyCaptionMode, setStoryCaptionMode] = useState<StoryCaptionMode>("image-only");
  const [tone, setTone] = useState<Tone>("professional");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>(
    input.initialOutputLanguage ?? "en"
  );
  const [customInstructions, setCustomInstructions] = useState(
    input.initialCustomInstructions || DEFAULT_CUSTOM_INSTRUCTIONS
  );
  const [brandColors, setBrandColors] = useState(defaultBrandColors);
  const [brandColorsHistory, setBrandColorsHistory] = useState<string[]>([defaultBrandColors]);
  const [keywords, setKeywords] = useState("");
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const generationAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      restoreCreatePostState({
        setActiveTab,
        setTopic,
        setMessage,
        setPostType,
        setCarouselSlideCount,
        setCarouselSlideContexts,
        setStoryCaptionMode,
        setTone,
        setOutputLanguage,
        setCustomInstructions,
        setBrandColors,
        setBrandColorsHistory,
        setKeywords,
        setCaption,
        setScheduleTime,
        setError,
        setSettingsMessage,
        setDraft
      });
    } catch {
      clearCreatePostState();
    } finally {
      setHasRestoredState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredState) {
      return;
    }

    const payload: CreatePostPersistedState = {
      activeTab,
      topic,
      message,
      postType,
      carouselSlideCount,
      carouselSlideContexts: carouselSlideContexts.map((item) => item.value),
      storyCaptionMode,
      tone,
      outputLanguage,
      customInstructions,
      brandColors,
      brandColorsHistory,
      keywords,
      draft,
      caption,
      scheduleTime,
      error,
      settingsMessage
    };

    persistCreatePostState(payload);
  }, [
    activeTab,
    topic,
    message,
    postType,
    carouselSlideCount,
    carouselSlideContexts,
    storyCaptionMode,
    tone,
    outputLanguage,
    customInstructions,
    brandColors,
    brandColorsHistory,
    keywords,
    draft,
    caption,
    scheduleTime,
    error,
    settingsMessage,
    hasRestoredState
  ]);

  useEffect(() => {
    return () => {
      generationAbortControllerRef.current?.abort();
      generationAbortControllerRef.current = null;
    };
  }, []);

  function normalizeBrandColorsValue(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }

  function saveBrandColorsToHistory(value = brandColors) {
    const normalized = normalizeBrandColorsValue(value);

    if (!normalized) {
      return;
    }

    setBrandColors((current) => normalizeBrandColorsValue(current) || current);
    setBrandColorsHistory((current) => {
      const next = [normalized, ...current.filter((item) => item !== normalized)];
      return next.slice(0, 12);
    });
  }

  useEffect(() => {
    if (!isGenerating || generationStartedAt === null) {
      setElapsedMs(0);
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - generationStartedAt);
    }, 250);

    return () => window.clearInterval(interval);
  }, [generationStartedAt, isGenerating]);

  useEffect(() => {
    if (postType !== "carousel") {
      return;
    }

    setCarouselSlideContexts((current) => normalizeSlideContexts(current, carouselSlideCount));
  }, [carouselSlideCount, postType]);

  const clientTimeoutMs = getClientGenerationTimeoutMs(postType, carouselSlideCount);

  const progressValue = isGenerating
    ? Math.min((elapsedMs / clientTimeoutMs) * 100, PROGRESS_CAP)
    : 0;
  const shouldShowSlowMessage = elapsedMs >= clientTimeoutMs * 0.7;
  const shouldShowCaptionEditor = postType !== "story" || storyCaptionMode === "with-caption";
  const effectiveCaption = shouldShowCaptionEditor ? caption : "";

  function clearPersistedState() {
    clearCreatePostState();
  }

  function clearGeneratedPost() {
    setDraft(null);
    setCaption("");
    setScheduleTime("");
    setError(null);
    setSettingsMessage(null);
  }

  function cancelGeneration() {
    generationAbortControllerRef.current?.abort();
    generationAbortControllerRef.current = null;
    setIsGenerating(false);
    setGenerationStartedAt(null);
    setError(input.dictionary.generator.generationCanceled);
  }

  async function generatePost() {
    const startedAt = Date.now();
    const controller = new AbortController();

    generationAbortControllerRef.current = controller;

    setIsGenerating(true);
    setGenerationStartedAt(startedAt);
    setError(null);
    setSettingsMessage(null);

    try {
      saveBrandColorsToHistory();
      const { response, json } = await generatePostService({
        topic,
        message,
        postType,
        carouselSlideCount,
        carouselSlideContexts: carouselSlideContexts.map((item) => item.value),
        tone,
        outputLanguage,
        customInstructions,
        brandColors,
        keywords,
        signal: controller.signal
      });

      if (!response.ok) {
        setError(json.error ?? input.dictionary.generator.generateError);
        return;
      }

      setDraft(json);
      setPostType(json.postType);
      setCaption(`${json.caption}\n\n${json.hashtags.join(" ")}`.trim());
    } catch (requestError) {
      if (requestError instanceof Error && requestError.name === "AbortError") {
        return;
      }

      setError(
        getClientRequestErrorMessage(
          requestError,
          input.dictionary.generator.generateError,
          input.dictionary.common.serverConnectionError
        )
      );
    } finally {
      if (generationAbortControllerRef.current === controller) {
        generationAbortControllerRef.current = null;
        setIsGenerating(false);
        setGenerationStartedAt(null);
      }
    }
  }

  async function publishNow() {
    if (!draft) {
      return;
    }

    setSettingsMessage(null);
    setIsPublishing(true);

    try {
      await publishPostService({
        postId: draft.postId,
        caption: effectiveCaption,
        postType,
        mediaItems: draft.mediaItems,
        imageUrl: draft.imageUrl,
        imagePath: draft.imagePath
      });

      clearPersistedState();
      input.onPublished();
    } catch (requestError) {
      setError(
        getClientRequestErrorMessage(
          requestError,
          input.dictionary.generator.publishError,
          input.dictionary.common.serverConnectionError
        )
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function schedulePost() {
    if (!draft || !scheduleTime) {
      setError(input.dictionary.generator.scheduleTimeRequired);
      return;
    }

    setSettingsMessage(null);
    setIsPublishing(true);

    try {
      await schedulePostService({
        postId: draft.postId,
        caption: effectiveCaption,
        scheduledTime: new Date(scheduleTime).toISOString(),
        postType,
        mediaItems: draft.mediaItems,
        imageUrl: draft.imageUrl,
        imagePath: draft.imagePath
      });

      clearPersistedState();
      input.onScheduled();
    } catch (requestError) {
      setError(
        getClientRequestErrorMessage(
          requestError,
          input.dictionary.generator.scheduleError,
          input.dictionary.common.serverConnectionError
        )
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function saveGenerationSettings() {
    setError(null);
    setSettingsMessage(null);
    setIsSavingSettings(true);

    try {
      const json = await saveGenerationSettingsService({
        outputLanguage,
        customInstructions
      });

      if (json.outputLanguage) {
        setOutputLanguage(json.outputLanguage);
      }

      if (typeof json.customInstructions === "string") {
        setCustomInstructions(json.customInstructions || DEFAULT_CUSTOM_INSTRUCTIONS);
      }

      setSettingsMessage(input.dictionary.generator.settingsSaved);
    } catch (requestError) {
      setError(
        getClientRequestErrorMessage(
          requestError,
          input.dictionary.generator.settingsSaveError,
          input.dictionary.common.serverConnectionError
        )
      );
    } finally {
      setIsSavingSettings(false);
    }
  }

  return {
    activeTab,
    setActiveTab,
    topic,
    setTopic,
    message,
    setMessage,
    postType,
    setPostType,
    carouselSlideCount,
    setCarouselSlideCount,
    carouselSlideContexts,
    setCarouselSlideContexts,
    storyCaptionMode,
    setStoryCaptionMode,
    tone,
    setTone,
    outputLanguage,
    setOutputLanguage,
    customInstructions,
    setCustomInstructions,
    brandColors,
    setBrandColors,
    brandColorsHistory,
    setBrandColorsHistory,
    keywords,
    setKeywords,
    draft,
    setDraft,
    caption,
    setCaption,
    scheduleTime,
    setScheduleTime,
    error,
    setError,
    settingsMessage,
    isGenerating,
    isPublishing,
    isSavingSettings,
    progressValue,
    elapsedMs,
    clientTimeoutMs,
    shouldShowSlowMessage,
    shouldShowCaptionEditor,
    effectiveCaption,
    saveBrandColorsToHistory,
    generatePost,
    cancelGeneration,
    clearGeneratedPost,
    publishNow,
    schedulePost,
    saveGenerationSettings
  };
}
