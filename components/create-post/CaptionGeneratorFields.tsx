"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CarouselSlideContext, DraftResponse, PostType } from "./types";
import { CaptionGeneratorFormatFields } from "./CaptionGeneratorFormatFields";
import { CaptionGeneratorPrimaryFields } from "./CaptionGeneratorPrimaryFields";

export function CaptionGeneratorFields(input: {
  dictionary: any;
  autoFieldKey: string | null;
  topic: string;
  setTopic: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  postType: PostType;
  setPostType: (value: PostType) => void;
  draft: DraftResponse | null;
  setDraft: Dispatch<SetStateAction<DraftResponse | null>>;
  tone: "professional" | "casual" | "promotional";
  setTone: (value: "professional" | "casual" | "promotional") => void;
  brandColors: string;
  setBrandColors: (value: string) => void;
  brandColorsHistory: string[];
  saveBrandColorsToHistory: () => void;
  carouselSlideCount: number;
  setCarouselSlideCount: (value: number) => void;
  carouselSlideContexts: CarouselSlideContext[];
  setCarouselSlideContexts: Dispatch<SetStateAction<CarouselSlideContext[]>>;
  storyCaptionMode: "image-only" | "with-caption";
  setStoryCaptionMode: (value: "image-only" | "with-caption") => void;
  keywords: string;
  setKeywords: (value: string) => void;
  onGenerateField: (field: "topic" | "message" | "keywords" | "carouselSlideContexts") => void;
}) {
  return (
    <div className="grid gap-4">
      <CaptionGeneratorPrimaryFields
        dictionary={input.dictionary}
        autoFieldKey={input.autoFieldKey}
        topic={input.topic}
        setTopic={input.setTopic}
        message={input.message}
        setMessage={input.setMessage}
        postType={input.postType}
        setPostType={input.setPostType}
        draft={input.draft}
        setDraft={input.setDraft}
        tone={input.tone}
        setTone={input.setTone}
        brandColors={input.brandColors}
        setBrandColors={input.setBrandColors}
        brandColorsHistory={input.brandColorsHistory}
        saveBrandColorsToHistory={input.saveBrandColorsToHistory}
        onGenerateField={input.onGenerateField}
      />
      <CaptionGeneratorFormatFields
        dictionary={input.dictionary}
        autoFieldKey={input.autoFieldKey}
        postType={input.postType}
        carouselSlideCount={input.carouselSlideCount}
        setCarouselSlideCount={input.setCarouselSlideCount}
        carouselSlideContexts={input.carouselSlideContexts}
        setCarouselSlideContexts={input.setCarouselSlideContexts}
        storyCaptionMode={input.storyCaptionMode}
        setStoryCaptionMode={input.setStoryCaptionMode}
        keywords={input.keywords}
        setKeywords={input.setKeywords}
        onGenerateField={input.onGenerateField}
      />
    </div>
  );
}
