"use client";

import { useState, useTransition } from "react";
import { generateCreatePostInputs as generateCreatePostInputsService } from "@/services/frontend/posts";
import { applyGeneratedCreatePostInputs } from "./auto-inputs";

export function useAutoCreatePostInputs(input: {
  dictionary: any;
  topic: string;
  setTopic: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  postType: "feed" | "story" | "carousel";
  tone: "professional" | "casual" | "promotional";
  brandColors: string;
  keywords: string;
  setKeywords: (value: string) => void;
  carouselSlideCount: number;
  carouselSlideContexts: Array<{ value: string }>;
  setCarouselSlideContexts: (value: Array<{ id: string; value: string }>) => void;
  outputLanguage: "en" | "pt-BR";
  customInstructions: string;
  setError: (value: string | null) => void;
}) {
  const [autoFieldKey, setAutoFieldKey] = useState<string | null>(null);
  const [isAutoGeneratingAll, startAutoGeneratingAll] = useTransition();

  async function generateCreatePostInputs(
    field?: "topic" | "message" | "keywords" | "carouselSlideContexts"
  ) {
    const requestKey = field ?? "all";
    setAutoFieldKey(requestKey);
    input.setError(null);
    try {
      applyGeneratedCreatePostInputs({
        field,
        response: await generateCreatePostInputsService({
          current: {
            topic: input.topic,
            message: input.message,
            postType: input.postType,
            tone: input.tone,
            brandColors: input.brandColors,
            keywords: input.keywords,
            carouselSlideCount: input.carouselSlideCount,
            carouselSlideContexts: input.carouselSlideContexts.map((item) => item.value),
            outputLanguage: input.outputLanguage,
            customInstructions: input.customInstructions
          }
        }),
        topic: input.topic,
        setTopic: input.setTopic,
        message: input.message,
        setMessage: input.setMessage,
        keywords: input.keywords,
        setKeywords: input.setKeywords,
        postType: input.postType,
        carouselSlideCount: input.carouselSlideCount,
        carouselSlideContexts: input.carouselSlideContexts,
        setCarouselSlideContexts: input.setCarouselSlideContexts
      });
    } catch (requestError) {
      input.setError(
        requestError instanceof Error ? requestError.message : input.dictionary.generator.generateError
      );
    } finally {
      setAutoFieldKey((current) => (current === requestKey ? null : current));
    }
  }

  function generateAllCreatePostInputs() {
    startAutoGeneratingAll(async () => {
      await generateCreatePostInputs();
    });
  }

  return {
    autoFieldKey,
    isAutoGeneratingAll,
    generateCreatePostInputs,
    generateAllCreatePostInputs
  };
}
