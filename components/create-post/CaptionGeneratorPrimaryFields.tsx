"use client";

import type { Dispatch, SetStateAction } from "react";
import { AutoFieldButton } from "./AutoFieldButton";
import { BrandColorsFields } from "./BrandColorsFields";
import type { DraftResponse, PostType } from "./types";

export function CaptionGeneratorPrimaryFields(input: {
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
  setBrandColors: Dispatch<SetStateAction<string>>;
  brandColorsHistory: string[];
  saveBrandColorsToHistory: () => void;
  removeBrandColorsFromHistory: (value: string) => void;
  onGenerateField: (field: "topic" | "message") => void;
}) {
  const { dictionary } = input;

  return (
    <>
      <label className="block text-sm font-medium text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <span>{dictionary.generator.topic}</span>
          <AutoFieldButton
            isLoading={input.autoFieldKey === "topic"}
            idleLabel={dictionary.generator.autoGenerateField}
            loadingLabel={dictionary.generator.autoGeneratingField}
            onClick={() => input.onGenerateField("topic")}
          />
        </div>
        <input
          value={input.topic}
          onChange={(event) => input.setTopic(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          placeholder={dictionary.generator.topicPlaceholder}
        />
        <span className="mt-2 block text-xs text-slate-500">{dictionary.generator.autoGenerateHint}</span>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <span>{dictionary.generator.message}</span>
          <AutoFieldButton
            isLoading={input.autoFieldKey === "message"}
            idleLabel={dictionary.generator.autoGenerateField}
            loadingLabel={dictionary.generator.autoGeneratingField}
            onClick={() => input.onGenerateField("message")}
          />
        </div>
        <textarea
          value={input.message}
          onChange={(event) => input.setMessage(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          placeholder={dictionary.generator.messagePlaceholder}
        />
        <span className="mt-2 block text-xs text-slate-500">{dictionary.generator.autoGenerateHint}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {dictionary.generator.postType}
          <select
            value={input.postType}
            onChange={(event) => {
              const nextPostType = event.target.value as PostType;
              input.setPostType(nextPostType);
              if (nextPostType !== "carousel" && input.draft) {
                input.setDraft((current) =>
                  current
                    ? {
                        ...current,
                        mediaItems: current.mediaItems.slice(0, 1),
                        imageUrl: current.mediaItems[0]?.imageUrl ?? current.imageUrl,
                        imagePath: current.mediaItems[0]?.imagePath ?? current.imagePath
                      }
                    : current
                );
              }
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          >
            <option value="feed">{dictionary.generator.postTypeFeed}</option>
            <option value="story">{dictionary.generator.postTypeStory}</option>
            <option value="carousel">{dictionary.generator.postTypeCarousel}</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          {dictionary.generator.tone}
          <select
            value={input.tone}
            onChange={(event) => input.setTone(event.target.value as "professional" | "casual" | "promotional")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          >
            <option value="professional">{dictionary.generator.toneProfessional}</option>
            <option value="casual">{dictionary.generator.toneCasual}</option>
            <option value="promotional">{dictionary.generator.tonePromotional}</option>
          </select>
        </label>

        <BrandColorsFields
          dictionary={dictionary}
          brandColors={input.brandColors}
          setBrandColors={input.setBrandColors}
          brandColorsHistory={input.brandColorsHistory}
          saveBrandColorsToHistory={input.saveBrandColorsToHistory}
          removeBrandColorsFromHistory={input.removeBrandColorsFromHistory}
        />
      </div>
    </>
  );
}
