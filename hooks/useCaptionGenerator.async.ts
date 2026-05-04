"use client";

import { getClientRequestErrorMessage } from "@/lib/client/http";
import { generatePost as generatePostService } from "@/services/frontend/posts";
export {
  persistCaptionSettings,
  publishCaptionPost,
  scheduleCaptionPost
} from "./useCaptionGenerator.publish";
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
  console.info("[create-post] Generation request started", {
    postType: state.postType,
    carouselSlideCount: state.carouselSlideCount,
    topic: state.topic,
    outputLanguage: state.outputLanguage,
    hasMessage: Boolean(state.message.trim()),
    hasKeywords: Boolean(state.keywords.trim()),
    allowSimilarPost: options?.allowSimilarPost ?? false
  });

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
    console.info("[create-post] Generation response received", {
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      postId: json.postId,
      mediaItemsCount: json.mediaItems?.length ?? 0,
      errorType: json.errorDetails?.type ?? null
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
    console.info("[create-post] Generation draft applied", {
      postId: json.postId,
      postType: json.postType,
      mediaItemsCount: json.mediaItems.length,
      durationMs: Date.now() - startedAt
    });
  } catch (requestError) {
    if (requestError instanceof Error && requestError.name === "AbortError") {
      console.info("[create-post] Generation request canceled", {
        durationMs: Date.now() - startedAt
      });
      return;
    }
    console.error("[create-post] Generation request failed", {
      durationMs: Date.now() - startedAt,
      error: requestError instanceof Error ? requestError.message : String(requestError)
    });
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
      console.info("[create-post] Generation request finished", {
        durationMs: Date.now() - startedAt
      });
    }
  }
}
