"use client";

import type { Dispatch, SetStateAction } from "react";
import { AutoFieldButton } from "./AutoFieldButton";
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
  setBrandColors: (value: string) => void;
  brandColorsHistory: string[];
  saveBrandColorsToHistory: () => void;
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

        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <span>{dictionary.generator.brandColors}</span>
            <button
              type="button"
              onClick={() => input.saveBrandColorsToHistory()}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              {dictionary.common.save}
            </button>
          </div>
          <input
            value={input.brandColors}
            onChange={(event) => input.setBrandColors(event.target.value)}
            onBlur={() => input.saveBrandColorsToHistory()}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
            placeholder="#0f172a, #ea580c, #f8fafc"
          />
          <span className="mt-2 block text-xs text-slate-500">{dictionary.generator.brandColorsHint}</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {input.brandColorsHistory.map((palette) => (
              <button
                key={palette}
                type="button"
                onClick={() => input.setBrandColors(palette)}
                className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${
                  palette === input.brandColors
                    ? "border-ink bg-ink text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-ink"
                }`}
              >
                {palette}
              </button>
            ))}
          </div>
        </label>
      </div>
    </>
  );
}
