import { parseJsonOrThrow, parseJsonResponse } from "@/lib/client/http";
import type {
  DraftResponse,
  MediaItem,
  OutputLanguage,
  PostType
} from "@/components/create-post/types";

export async function generatePost(input: {
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
  signal?: AbortSignal;
}) {
  const response = await fetch("/api/posts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: input.topic,
      message: input.message,
      postType: input.postType,
      carouselSlideCount: input.carouselSlideCount,
      carouselSlideContexts: input.carouselSlideContexts,
      tone: input.tone,
      outputLanguage: input.outputLanguage,
      customInstructions: input.customInstructions,
      brandColors: input.brandColors,
      keywords: input.keywords
    }),
    signal: input.signal
  });

  return {
    response,
    json: await parseJsonResponse<DraftResponse & { error?: string }>(response)
  };
}

export async function publishPost(input: {
  postId: string;
  caption: string;
  postType: PostType;
  mediaItems: MediaItem[];
  imageUrl: string;
  imagePath: string;
}) {
  const response = await fetch("/api/posts/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; postId: string; error?: string }>(
    response,
    "Unable to publish."
  );
}

export async function schedulePost(input: {
  postId: string;
  caption: string;
  scheduledTime: string;
  postType: PostType;
  mediaItems: MediaItem[];
  imageUrl: string;
  imagePath: string;
}) {
  const response = await fetch("/api/posts/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; error?: string }>(response, "Unable to schedule.");
}

export async function deletePosts(postIds: string[]) {
  const response = await fetch("/api/posts/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ postIds })
  });

  return parseJsonOrThrow<{ ok: true; deletedCount: number; error?: string }>(
    response,
    "Unable to delete the selected posts."
  );
}

export async function uploadImage(file: File, markAsAiGenerated: boolean) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("markAsAiGenerated", String(markAsAiGenerated));

  const response = await fetch("/api/posts/upload-image", {
    method: "POST",
    body: formData
  });

  return parseJsonOrThrow<
    {
      imageUrl?: string;
      imagePath?: string;
      previewUrl?: string;
      error?: string;
    }
  >(response, "Upload failed.");
}

export async function generateCreatePostInputs(input: {
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
}) {
  const response = await fetch("/api/posts/generate-inputs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<
    {
      topic?: string;
      message?: string;
      keywords?: string;
      brandColors?: string;
      carouselSlideContexts?: string[];
      error?: string;
    }
  >(response, "Unable to generate create-post inputs.");
}
