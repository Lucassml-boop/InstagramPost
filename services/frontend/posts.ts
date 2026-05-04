import { parseJsonOrThrow, parseJsonResponse } from "@/lib/client/http";
import type {
  GenerateCreatePostInputsInput,
  GeneratePostInput,
  GeneratePostResponse,
  InspectAiMetadataResponse,
  PublishPostInput,
  SchedulePostInput
} from "./posts.types";

export async function generatePost(input: GeneratePostInput) {
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
      keywords: input.keywords,
      userTopicHint: input.userTopicHint ?? "",
      allowSimilarPost: input.allowSimilarPost ?? false
    }),
    signal: input.signal
  });

  return {
    response,
    json: await parseJsonResponse<GeneratePostResponse>(response)
  };
}

export async function publishPost(input: PublishPostInput) {
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

export async function schedulePost(input: SchedulePostInput) {
  const response = await fetch("/api/posts/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; error?: string }>(response, "Unable to schedule.");
}

export async function publishNow(postId: string) {
  const response = await fetch("/api/posts/publish-now", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId })
  });

  return parseJsonOrThrow<{ ok: true; error?: string }>(
    response,
    "Unable to publish post now."
  );
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

export async function inspectAiMetadata(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/posts/inspect-ai-metadata", {
    method: "POST",
    body: formData
  });

  return parseJsonOrThrow<InspectAiMetadataResponse>(
    response,
    "Unable to inspect AI metadata."
  );
}

export async function generateCreatePostInputs(input: GenerateCreatePostInputsInput) {
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
