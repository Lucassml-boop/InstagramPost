export type OutputLanguage = "en" | "pt-BR";
export type PostType = "feed" | "story" | "carousel";
export type StoryCaptionMode = "image-only" | "with-caption";
export type Tone = "professional" | "casual" | "promotional";

export type BrandColorPalette = {
  primary: string;
  background: string;
  support: string;
  accent: string;
};

export type MediaItem = {
  imageUrl: string;
  imagePath: string;
  previewUrl?: string;
};

export type CarouselSlideContext = {
  id: string;
  value: string;
};

export type DraftResponse = {
  postId: string;
  postType: PostType;
  mediaItems: MediaItem[];
  imageUrl: string;
  imagePath: string;
  caption: string;
  hashtags: string[];
  htmlLayout: string;
};

export type CreatePostPersistedState = {
  activeTab: "content" | "settings";
  topic: string;
  message: string;
  postType: PostType;
  carouselSlideCount: number;
  carouselSlideContexts: string[];
  storyCaptionMode: StoryCaptionMode;
  tone: Tone;
  outputLanguage: OutputLanguage;
  customInstructions: string;
  brandColors: string;
  brandColorsHistory: string[];
  keywords: string;
  draft: DraftResponse | null;
  caption: string;
  scheduleTime: string;
  error: string | null;
  settingsMessage: string | null;
};
