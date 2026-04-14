"use client";

import { getClientRequestErrorMessage } from "@/lib/client/http";
import { DEFAULT_CUSTOM_INSTRUCTIONS } from "@/components/create-post/constants";
import {
  generatePost as generatePostService,
  publishPost as publishPostService,
  schedulePost as schedulePostService
} from "@/services/frontend/posts";
import { saveGenerationSettings as saveGenerationSettingsService } from "@/services/frontend/user";
import type {
  CaptionGeneratorState,
  UseCaptionGeneratorInput
} from "./useCaptionGenerator.types";

export async function generateCaptionPost(
  state: CaptionGeneratorState,
  dictionary: UseCaptionGeneratorInput["dictionary"],
  saveBrandColorsToHistory: () => void,
  options?: { allowSimilarPost?: boolean; userTopicHint?: string }
) {
  const startedAt = Date.now();
  const controller = new AbortController();
  state.generationAbortControllerRef.current = controller;
  state.setIsGenerating(true);
  state.setGenerationStartedAt(startedAt);
  state.setError(null);
  state.setSettingsMessage(null);

  try {
    saveBrandColorsToHistory();
    const { response, json } = await generatePostService({
      topic: state.topic,
      message: state.message,
      postType: state.postType,
      carouselSlideCount: state.carouselSlideCount,
      carouselSlideContexts: state.carouselSlideContexts.map((item) => item.value),
      tone: state.tone,
      outputLanguage: state.outputLanguage,
      customInstructions: state.customInstructions,
      brandColors: state.brandColors,
      keywords: state.keywords,
      userTopicHint: options?.userTopicHint ?? "",
      allowSimilarPost: options?.allowSimilarPost ?? false,
      signal: controller.signal
    });

    if (!response.ok) {
      if (json.errorDetails?.type === "similar-manual-post" && json.error) {
        state.setError({
          type: "similar-manual-post",
          message: json.error,
          similarPost: json.errorDetails.similarPost
        });
        return;
      }

      state.setError(json.error ?? dictionary.generator.generateError);
      return;
    }

    state.setDraft(json);
    state.setPostType(json.postType);
    state.setCaption(`${json.caption}\n\n${json.hashtags.join(" ")}`.trim());
  } catch (requestError) {
    if (requestError instanceof Error && requestError.name === "AbortError") {
      return;
    }
    state.setError(
      getClientRequestErrorMessage(
        requestError,
        dictionary.generator.generateError,
        dictionary.common.serverConnectionError
      )
    );
  } finally {
    if (state.generationAbortControllerRef.current === controller) {
      state.generationAbortControllerRef.current = null;
      state.setIsGenerating(false);
      state.setGenerationStartedAt(null);
    }
  }
}

export async function publishCaptionPost(input: {
  state: CaptionGeneratorState;
  dictionary: UseCaptionGeneratorInput["dictionary"];
  effectiveCaption: string;
  clearPersistedState: () => void;
  onPublished: () => void;
}) {
  if (!input.state.draft) {
    return;
  }
  input.state.setSettingsMessage(null);
  input.state.setIsPublishing(true);
  try {
    await publishPostService({
      postId: input.state.draft.postId,
      caption: input.effectiveCaption,
      postType: input.state.postType,
      mediaItems: input.state.draft.mediaItems,
      imageUrl: input.state.draft.imageUrl,
      imagePath: input.state.draft.imagePath
    });
    input.clearPersistedState();
    input.onPublished();
  } catch (requestError) {
    input.state.setError(
      getClientRequestErrorMessage(
        requestError,
        input.dictionary.generator.publishError,
        input.dictionary.common.serverConnectionError
      )
    );
  } finally {
    input.state.setIsPublishing(false);
  }
}

export async function scheduleCaptionPost(input: {
  state: CaptionGeneratorState;
  dictionary: UseCaptionGeneratorInput["dictionary"];
  effectiveCaption: string;
  clearPersistedState: () => void;
  onScheduled: () => void;
}) {
  if (!input.state.draft || !input.state.scheduleTime) {
    input.state.setError(input.dictionary.generator.scheduleTimeRequired);
    return;
  }
  input.state.setSettingsMessage(null);
  input.state.setIsPublishing(true);
  try {
    await schedulePostService({
      postId: input.state.draft.postId,
      caption: input.effectiveCaption,
      scheduledTime: new Date(input.state.scheduleTime).toISOString(),
      postType: input.state.postType,
      mediaItems: input.state.draft.mediaItems,
      imageUrl: input.state.draft.imageUrl,
      imagePath: input.state.draft.imagePath
    });
    input.clearPersistedState();
    input.onScheduled();
  } catch (requestError) {
    input.state.setError(
      getClientRequestErrorMessage(
        requestError,
        input.dictionary.generator.scheduleError,
        input.dictionary.common.serverConnectionError
      )
    );
  } finally {
    input.state.setIsPublishing(false);
  }
}

export async function persistCaptionSettings(
  state: CaptionGeneratorState,
  dictionary: UseCaptionGeneratorInput["dictionary"]
) {
  state.setError(null);
  state.setSettingsMessage(null);
  state.setIsSavingSettings(true);
  try {
    const json = await saveGenerationSettingsService({
      outputLanguage: state.outputLanguage,
      customInstructions: state.customInstructions
    });
    if (json.outputLanguage) {
      state.setOutputLanguage(json.outputLanguage);
    }
    if (typeof json.customInstructions === "string") {
      state.setCustomInstructions(json.customInstructions || DEFAULT_CUSTOM_INSTRUCTIONS);
    }
    state.setSettingsMessage(dictionary.generator.settingsSaved);
  } catch (requestError) {
    state.setError(
      getClientRequestErrorMessage(
        requestError,
        dictionary.generator.settingsSaveError,
        dictionary.common.serverConnectionError
      )
    );
  } finally {
    state.setIsSavingSettings(false);
  }
}
