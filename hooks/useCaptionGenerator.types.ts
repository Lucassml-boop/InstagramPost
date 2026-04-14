import type {
  CarouselSlideContext,
  DraftResponse,
  GeneratorErrorState,
  OutputLanguage,
  PostType,
  StoryCaptionMode,
  Tone
} from "@/components/create-post/types";

export type CaptionGeneratorDictionary = {
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

export type UseCaptionGeneratorInput = {
  initialOutputLanguage?: OutputLanguage;
  initialCustomInstructions?: string;
  dictionary: CaptionGeneratorDictionary;
  onPublished: () => void;
  onScheduled: () => void;
};

export type CaptionGeneratorState = {
  activeTab: "content" | "settings";
  setActiveTab: (value: "content" | "settings") => void;
  topic: string;
  setTopic: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  lastAutoGenerateTopicHint: string;
  setLastAutoGenerateTopicHint: (value: string) => void;
  lastGeneratePostTopicHint: string;
  setLastGeneratePostTopicHint: (value: string) => void;
  postType: PostType;
  setPostType: (value: PostType) => void;
  carouselSlideCount: number;
  setCarouselSlideCount: (value: number) => void;
  carouselSlideContexts: CarouselSlideContext[];
  setCarouselSlideContexts: React.Dispatch<React.SetStateAction<CarouselSlideContext[]>>;
  storyCaptionMode: StoryCaptionMode;
  setStoryCaptionMode: (value: StoryCaptionMode) => void;
  tone: Tone;
  setTone: (value: Tone) => void;
  outputLanguage: OutputLanguage;
  setOutputLanguage: (value: OutputLanguage) => void;
  customInstructions: string;
  setCustomInstructions: (value: string) => void;
  brandColors: string;
  setBrandColors: React.Dispatch<React.SetStateAction<string>>;
  brandColorsHistory: string[];
  setBrandColorsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  keywords: string;
  setKeywords: (value: string) => void;
  draft: DraftResponse | null;
  setDraft: React.Dispatch<React.SetStateAction<DraftResponse | null>>;
  caption: string;
  setCaption: (value: string) => void;
  scheduleTime: string;
  setScheduleTime: (value: string) => void;
  error: GeneratorErrorState | null;
  setError: (value: GeneratorErrorState | null) => void;
  settingsMessage: string | null;
  setSettingsMessage: (value: string | null) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  isPublishing: boolean;
  setIsPublishing: (value: boolean) => void;
  isSavingSettings: boolean;
  setIsSavingSettings: (value: boolean) => void;
  generationStartedAt: number | null;
  setGenerationStartedAt: (value: number | null) => void;
  elapsedMs: number;
  setElapsedMs: (value: number) => void;
  hasRestoredState: boolean;
  setHasRestoredState: (value: boolean) => void;
  generationAbortControllerRef: React.MutableRefObject<AbortController | null>;
};
