import {
  CREATE_POST_BRAND_COLORS_HISTORY_KEY,
  CREATE_POST_STORAGE_KEY
} from "./constants";
import {
  isOutputLanguage,
  isPostType,
  isStoryCaptionMode,
  isTone,
  restoreCarouselContexts,
  sanitizeDraft
} from "./utils";
import { restorePersistedError } from "./persistence.errors";
import type {
  CarouselSlideContext,
  CreatePostPersistedState,
  DraftResponse,
  GeneratorErrorState,
  OutputLanguage,
  PostType,
  StoryCaptionMode,
  Tone
} from "./types";

type RestoreHandlers = {
  setActiveTab: (value: "content" | "settings") => void;
  setTopic: (value: string) => void;
  setMessage: (value: string) => void;
  setLastAutoGenerateTopicHint: (value: string) => void;
  setLastGeneratePostTopicHint: (value: string) => void;
  setPostType: (value: PostType) => void;
  setCarouselSlideCount: (value: number) => void;
  setCarouselSlideContexts: (value: CarouselSlideContext[]) => void;
  setStoryCaptionMode: (value: StoryCaptionMode) => void;
  setTone: (value: Tone) => void;
  setOutputLanguage: (value: OutputLanguage) => void;
  setCustomInstructions: (value: string) => void;
  setBrandColors: (value: string) => void;
  setBrandColorsHistory: (value: string[]) => void;
  setKeywords: (value: string) => void;
  setCaption: (value: string) => void;
  setScheduleTime: (value: string) => void;
  setError: (value: GeneratorErrorState) => void;
  setSettingsMessage: (value: string) => void;
  setDraft: (value: DraftResponse) => void;
};

export function restoreCreatePostState(handlers: RestoreHandlers) {
  const raw = window.localStorage.getItem(CREATE_POST_STORAGE_KEY);
  const rawBrandColorsHistory = window.localStorage.getItem(CREATE_POST_BRAND_COLORS_HISTORY_KEY);

  if (rawBrandColorsHistory) {
    try {
      const parsedBrandColorsHistory = JSON.parse(rawBrandColorsHistory) as unknown;

      if (Array.isArray(parsedBrandColorsHistory)) {
        handlers.setBrandColorsHistory(
          parsedBrandColorsHistory.filter((value): value is string => typeof value === "string")
        );
      }
    } catch {
      window.localStorage.removeItem(CREATE_POST_BRAND_COLORS_HISTORY_KEY);
    }
  }

  if (!raw) {
    return;
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (
    typeof parsed.activeTab === "string" &&
    (parsed.activeTab === "content" || parsed.activeTab === "settings")
  ) {
    handlers.setActiveTab(parsed.activeTab);
  }

  if (typeof parsed.topic === "string") {
    handlers.setTopic(parsed.topic);
  }

  if (typeof parsed.message === "string") {
    handlers.setMessage(parsed.message);
  }

  if (typeof parsed.lastAutoGenerateTopicHint === "string") {
    handlers.setLastAutoGenerateTopicHint(parsed.lastAutoGenerateTopicHint);
  }

  if (typeof parsed.lastGeneratePostTopicHint === "string") {
    handlers.setLastGeneratePostTopicHint(parsed.lastGeneratePostTopicHint);
  }

  if (isPostType(parsed.postType)) {
    handlers.setPostType(parsed.postType);
  }

  if (
    typeof parsed.carouselSlideCount === "number" &&
    parsed.carouselSlideCount >= 2 &&
    parsed.carouselSlideCount <= 10
  ) {
    handlers.setCarouselSlideCount(parsed.carouselSlideCount);
  }

  const restoredContexts = restoreCarouselContexts(parsed.carouselSlideContexts);
  if (restoredContexts) {
    handlers.setCarouselSlideContexts(restoredContexts);
  }

  if (isStoryCaptionMode(parsed.storyCaptionMode)) {
    handlers.setStoryCaptionMode(parsed.storyCaptionMode);
  }

  if (isTone(parsed.tone)) {
    handlers.setTone(parsed.tone);
  }

  if (isOutputLanguage(parsed.outputLanguage)) {
    handlers.setOutputLanguage(parsed.outputLanguage);
  }

  if (typeof parsed.customInstructions === "string") {
    handlers.setCustomInstructions(parsed.customInstructions);
  }

  if (typeof parsed.brandColors === "string") {
    handlers.setBrandColors(parsed.brandColors);
  }

  if (Array.isArray(parsed.brandColorsHistory)) {
    handlers.setBrandColorsHistory(
      parsed.brandColorsHistory.filter((value): value is string => typeof value === "string")
    );
  }

  if (typeof parsed.keywords === "string") {
    handlers.setKeywords(parsed.keywords);
  }

  if (typeof parsed.caption === "string") {
    handlers.setCaption(parsed.caption);
  }

  if (typeof parsed.scheduleTime === "string") {
    handlers.setScheduleTime(parsed.scheduleTime);
  }

  const restoredError = restorePersistedError(parsed.error);
  if (restoredError) {
    handlers.setError(restoredError);
  }

  if (typeof parsed.settingsMessage === "string") {
    handlers.setSettingsMessage(parsed.settingsMessage);
  }

  const restoredDraft = sanitizeDraft(parsed.draft);
  if (restoredDraft) {
    handlers.setDraft(restoredDraft);
    handlers.setPostType(restoredDraft.postType);
  }
}

export function persistCreatePostState(state: CreatePostPersistedState) {
  window.localStorage.setItem(CREATE_POST_STORAGE_KEY, JSON.stringify(state));
  window.localStorage.setItem(
    CREATE_POST_BRAND_COLORS_HISTORY_KEY,
    JSON.stringify(state.brandColorsHistory)
  );
}

export function clearCreatePostState() {
  window.localStorage.removeItem(CREATE_POST_STORAGE_KEY);
}
