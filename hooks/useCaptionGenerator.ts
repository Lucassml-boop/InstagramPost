"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_CAROUSEL_SLIDE_COUNT,
  DEFAULT_CUSTOM_INSTRUCTIONS,
  PROGRESS_CAP
} from "@/components/create-post/constants";
import type {
  CarouselSlideContext,
  DraftResponse,
  GeneratorErrorState,
  OutputLanguage,
  PostType,
  StoryCaptionMode,
  Tone
} from "@/components/create-post/types";
import {
  createSlideContexts,
  getClientGenerationTimeoutMs,
  getGenerationStatus,
  normalizeSlideContexts,
  parseBrandColors,
  serializeBrandColors
} from "@/components/create-post/utils";
import { useCaptionGeneratorActions } from "./useCaptionGenerator.actions";
import { useCaptionGeneratorPersistence } from "./useCaptionGenerator.persistence";
import type { UseCaptionGeneratorInput } from "./useCaptionGenerator.types";

export function useCaptionGenerator(input: UseCaptionGeneratorInput) {
  const defaultBrandColors = serializeBrandColors({
    primary: "#d62976",
    background: "#101828",
    support: "",
    accent: ""
  });
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [lastAutoGenerateTopicHint, setLastAutoGenerateTopicHint] = useState("");
  const [lastGeneratePostTopicHint, setLastGeneratePostTopicHint] = useState("");
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
  const [error, setError] = useState<GeneratorErrorState | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const generationAbortControllerRef = useRef<AbortController | null>(null);

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
  const generationStatus = getGenerationStatus({
    elapsedMs,
    clientTimeoutMs,
    postType,
    carouselSlideCount,
    outputLanguage
  });
  const shouldShowCaptionEditor = postType !== "story" || storyCaptionMode === "with-caption";
  const effectiveCaption = shouldShowCaptionEditor ? caption : "";
  const state = {
    activeTab,
    setActiveTab,
    topic,
    setTopic,
    message,
    setMessage,
    lastAutoGenerateTopicHint,
    setLastAutoGenerateTopicHint,
    lastGeneratePostTopicHint,
    setLastGeneratePostTopicHint,
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
    setSettingsMessage,
    isGenerating,
    setIsGenerating,
    isPublishing,
    setIsPublishing,
    isSavingSettings,
    setIsSavingSettings,
    generationStartedAt,
    setGenerationStartedAt,
    elapsedMs,
    setElapsedMs,
    hasRestoredState,
    setHasRestoredState,
    generationAbortControllerRef
  };
  const { clearPersistedState } = useCaptionGeneratorPersistence(state);

  useEffect(() => {
    const palette = parseBrandColors(brandColors);
    const isLegacyDefaultPalette =
      palette.primary === "#d62976" &&
      palette.background === "#101828" &&
      palette.support === "#f59e0b" &&
      palette.accent === "#f8fafc";

    if (isLegacyDefaultPalette) {
      setBrandColors(defaultBrandColors);
    }
  }, [brandColors, defaultBrandColors]);

  useEffect(() => {
    setBrandColorsHistory((current) => {
      const normalized = current.map((value) => {
        const palette = parseBrandColors(value);
        const isLegacyDefaultPalette =
          palette.primary === "#d62976" &&
          palette.background === "#101828" &&
          palette.support === "#f59e0b" &&
          palette.accent === "#f8fafc";

        return isLegacyDefaultPalette ? defaultBrandColors : value;
      });

      const deduped = Array.from(new Set(normalized));
      const unchanged =
        deduped.length === current.length && deduped.every((value, index) => value === current[index]);

      return unchanged ? current : deduped;
    });
  }, [defaultBrandColors]);

  const actions = useCaptionGeneratorActions({
    state,
    dictionary: input.dictionary,
    effectiveCaption,
    clearPersistedState,
    onPublished: input.onPublished,
    onScheduled: input.onScheduled
  });

  return {
    ...state,
    progressValue,
    clientTimeoutMs,
    generationStatus,
    shouldShowSlowMessage,
    shouldShowCaptionEditor,
    effectiveCaption,
    ...actions
  };
}
