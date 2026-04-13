"use client";

import type {
  CaptionGeneratorState,
  UseCaptionGeneratorInput
} from "./useCaptionGenerator.types";
import {
  generateCaptionPost,
  persistCaptionSettings,
  publishCaptionPost,
  scheduleCaptionPost
} from "./useCaptionGenerator.async";

function normalizeBrandColorsValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

export function useCaptionGeneratorActions(input: {
  state: CaptionGeneratorState;
  dictionary: UseCaptionGeneratorInput["dictionary"];
  effectiveCaption: string;
  clearPersistedState: () => void;
  onPublished: () => void;
  onScheduled: () => void;
}) {
  const { state } = input;

  function saveBrandColorsToHistory(value = state.brandColors) {
    const normalized = normalizeBrandColorsValue(value);
    if (!normalized) {
      return;
    }
    state.setBrandColors((current) => normalizeBrandColorsValue(current) || current);
    state.setBrandColorsHistory((current) => {
      const next = [normalized, ...current.filter((item) => item !== normalized)];
      return next.slice(0, 12);
    });
  }

  function clearGeneratedPost() {
    state.setDraft(null);
    state.setCaption("");
    state.setScheduleTime("");
    state.setError(null);
    state.setSettingsMessage(null);
  }

  function cancelGeneration() {
    state.generationAbortControllerRef.current?.abort();
    state.generationAbortControllerRef.current = null;
    state.setIsGenerating(false);
    state.setGenerationStartedAt(null);
    state.setError(input.dictionary.generator.generationCanceled);
  }

  async function generatePost() {
    await generateCaptionPost(state, input.dictionary, saveBrandColorsToHistory);
  }

  async function publishNow() {
    await publishCaptionPost({
      state,
      dictionary: input.dictionary,
      effectiveCaption: input.effectiveCaption,
      clearPersistedState: input.clearPersistedState,
      onPublished: input.onPublished
    });
  }

  async function schedulePost() {
    await scheduleCaptionPost({
      state,
      dictionary: input.dictionary,
      effectiveCaption: input.effectiveCaption,
      clearPersistedState: input.clearPersistedState,
      onScheduled: input.onScheduled
    });
  }

  async function saveGenerationSettings() {
    await persistCaptionSettings(state, input.dictionary);
  }

  return {
    saveBrandColorsToHistory,
    clearGeneratedPost,
    cancelGeneration,
    generatePost,
    publishNow,
    schedulePost,
    saveGenerationSettings
  };
}
