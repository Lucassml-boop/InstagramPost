"use client";

import { useEffect } from "react";
import {
  clearCreatePostState,
  persistCreatePostState,
  restoreCreatePostState
} from "@/components/create-post/persistence";
import type { CreatePostPersistedState } from "@/components/create-post/types";
import type { CaptionGeneratorState } from "./useCaptionGenerator.types";

export function useCaptionGeneratorPersistence(state: CaptionGeneratorState) {
  useEffect(() => {
    try {
      restoreCreatePostState({
        setActiveTab: state.setActiveTab,
        setTopic: state.setTopic,
        setMessage: state.setMessage,
        setPostType: state.setPostType,
        setCarouselSlideCount: state.setCarouselSlideCount,
        setCarouselSlideContexts: state.setCarouselSlideContexts,
        setStoryCaptionMode: state.setStoryCaptionMode,
        setTone: state.setTone,
        setOutputLanguage: state.setOutputLanguage,
        setCustomInstructions: state.setCustomInstructions,
        setBrandColors: state.setBrandColors,
        setBrandColorsHistory: state.setBrandColorsHistory,
        setKeywords: state.setKeywords,
        setCaption: state.setCaption,
        setScheduleTime: state.setScheduleTime,
        setError: (value) => state.setError(value),
        setSettingsMessage: (value) => state.setSettingsMessage(value),
        setDraft: (value) => state.setDraft(value)
      });
    } catch {
      clearCreatePostState();
    } finally {
      state.setHasRestoredState(true);
    }
  }, []);

  useEffect(() => {
    if (!state.hasRestoredState) {
      return;
    }

    const payload: CreatePostPersistedState = {
      activeTab: state.activeTab,
      topic: state.topic,
      message: state.message,
      postType: state.postType,
      carouselSlideCount: state.carouselSlideCount,
      carouselSlideContexts: state.carouselSlideContexts.map((item) => item.value),
      storyCaptionMode: state.storyCaptionMode,
      tone: state.tone,
      outputLanguage: state.outputLanguage,
      customInstructions: state.customInstructions,
      brandColors: state.brandColors,
      brandColorsHistory: state.brandColorsHistory,
      keywords: state.keywords,
      draft: state.draft,
      caption: state.caption,
      scheduleTime: state.scheduleTime,
      error: state.error,
      settingsMessage: state.settingsMessage
    };

    persistCreatePostState(payload);
  }, [
    state.activeTab,
    state.topic,
    state.message,
    state.postType,
    state.carouselSlideCount,
    state.carouselSlideContexts,
    state.storyCaptionMode,
    state.tone,
    state.outputLanguage,
    state.customInstructions,
    state.brandColors,
    state.brandColorsHistory,
    state.keywords,
    state.draft,
    state.caption,
    state.scheduleTime,
    state.error,
    state.settingsMessage,
    state.hasRestoredState
  ]);

  useEffect(() => {
    return () => {
      state.generationAbortControllerRef.current?.abort();
      state.generationAbortControllerRef.current = null;
    };
  }, []);

  return {
    clearPersistedState() {
      clearCreatePostState();
    }
  };
}
