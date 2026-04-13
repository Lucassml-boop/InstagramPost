import { createSlideContexts } from "./utils";

export function applyGeneratedCreatePostInputs(input: {
  field?: "topic" | "message" | "keywords" | "carouselSlideContexts";
  response: {
    topic?: string;
    message?: string;
    keywords?: string;
    carouselSlideContexts?: string[];
  };
  topic: string;
  setTopic: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  keywords: string;
  setKeywords: (value: string) => void;
  postType: "feed" | "story" | "carousel";
  carouselSlideCount: number;
  carouselSlideContexts: Array<{ value: string }>;
  setCarouselSlideContexts: (
    value: Array<{ id: string; value: string }>
  ) => void;
}) {
  if (!input.field || input.field === "topic") {
    input.setTopic(input.response.topic ?? input.topic);
  }
  if (!input.field || input.field === "message") {
    input.setMessage(input.response.message ?? input.message);
  }
  if (!input.field || input.field === "keywords") {
    input.setKeywords(input.response.keywords ?? input.keywords);
  }
  if ((!input.field || input.field === "carouselSlideContexts") && input.postType === "carousel") {
    const nextContexts =
      input.response.carouselSlideContexts ??
      input.carouselSlideContexts.map((item) => item.value);
    input.setCarouselSlideContexts(
      createSlideContexts(input.carouselSlideCount).map((item, index) => ({
        ...item,
        value: nextContexts[index] ?? ""
      }))
    );
  }
}
