import type {
  DraftResponse,
  GeneratorErrorState,
  MediaItem,
  OutputLanguage,
  PostType
} from "@/components/create-post/types";

export type GeneratePostErrorResponse = {
  error?: string;
  errorDetails?: {
    type: "similar-manual-post";
    similarPost: Extract<GeneratorErrorState, { type: "similar-manual-post" }>["similarPost"];
  };
};

export type GeneratePostInput = {
  topic: string;
  message: string;
  postType: PostType;
  carouselSlideCount: number;
  carouselSlideContexts: string[];
  tone: "professional" | "casual" | "promotional";
  outputLanguage: OutputLanguage;
  customInstructions: string;
  brandColors: string;
  keywords: string;
  userTopicHint?: string;
  allowSimilarPost?: boolean;
  signal?: AbortSignal;
};

export type PublishPostInput = {
  postId: string;
  caption: string;
  postType: PostType;
  mediaItems: MediaItem[];
  imageUrl: string;
  imagePath: string;
};

export type SchedulePostInput = PublishPostInput & {
  scheduledTime: string;
};

export type InspectAiMetadataResponse = {
  exiftoolAvailable: boolean;
  expectedDigitalSourceType: string;
  detected: {
    digitalSourceType: string | null;
    creator: string | null;
    creatorTool: string | null;
    description: string | null;
    credit: string | null;
    rights: string | null;
  };
  hasAiMetadata: boolean;
  rawOutput: Record<string, unknown> | null;
  error?: string;
};

export type GenerateCreatePostInputsInput = {
  current: {
    topic: string;
    message: string;
    postType: PostType;
    tone: "professional" | "casual" | "promotional";
    brandColors: string;
    keywords: string;
    carouselSlideCount: number;
    carouselSlideContexts: string[];
    outputLanguage: OutputLanguage;
    customInstructions: string;
  };
  userTopicHint?: string;
};

export type GeneratePostResponse = DraftResponse & GeneratePostErrorResponse;
