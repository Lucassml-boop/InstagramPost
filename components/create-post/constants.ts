export const DEFAULT_GENERATION_TIMEOUT_MS = 480_000;
export const CAROUSEL_EXTRA_TIMEOUT_PER_SLIDE_MS = 240_000;
export const CLIENT_TIMEOUT_BASE_MS = Number(
  process.env.NEXT_PUBLIC_OLLAMA_TIMEOUT_MS ?? DEFAULT_GENERATION_TIMEOUT_MS
);
export const PROGRESS_CAP = 96;
export const DEFAULT_CUSTOM_INSTRUCTIONS =
  "You are an expert Instagram content strategist and visual designer.";
export const DEFAULT_CAROUSEL_SLIDE_COUNT = 3;
export const CREATE_POST_STORAGE_KEY = "create-post-state-v1";
export const CREATE_POST_BRAND_COLORS_HISTORY_KEY = "create-post-brand-colors-history-v1";
