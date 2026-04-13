"use client";

import type { Dispatch, SetStateAction } from "react";
import { AutoFieldButton } from "./AutoFieldButton";
import { createSlideContexts } from "./utils";
import type { CarouselSlideContext } from "./types";

export function CaptionGeneratorFormatFields(input: {
  dictionary: any;
  autoFieldKey: string | null;
  postType: "feed" | "story" | "carousel";
  carouselSlideCount: number;
  setCarouselSlideCount: (value: number) => void;
  carouselSlideContexts: CarouselSlideContext[];
  setCarouselSlideContexts: Dispatch<SetStateAction<CarouselSlideContext[]>>;
  storyCaptionMode: "image-only" | "with-caption";
  setStoryCaptionMode: (value: "image-only" | "with-caption") => void;
  keywords: string;
  setKeywords: (value: string) => void;
  onGenerateField: (field: "keywords" | "carouselSlideContexts") => void;
}) {
  const { dictionary } = input;

  return (
    <>
      {input.postType === "carousel" ? (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-ink">{dictionary.generator.carouselSlides}</p>
            <p className="mt-1 text-sm text-slate-600">{dictionary.generator.carouselSlidesDescription}</p>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-ink">{dictionary.generator.carouselDefaultStructure}</p>
              <p className="mt-2">{dictionary.generator.carouselDefaultStructureDescription}</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            {dictionary.generator.carouselSlidesCount}
            <select
              value={input.carouselSlideCount}
              onChange={(event) => input.setCarouselSlideCount(Number(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
            >
              {Array.from({ length: 9 }, (_, index) => index + 2).map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4">
            {input.carouselSlideContexts.map((item, index) => (
              <label key={item.id} className="block text-sm font-medium text-slate-700">
                {dictionary.generator.carouselSlideContextLabel} {index + 1}
                <textarea
                  value={item.value}
                  onChange={(event) =>
                    input.setCarouselSlideContexts((current) =>
                      current.map((context, contextIndex) =>
                        contextIndex === index ? { ...context, value: event.target.value } : context
                      )
                    )
                  }
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                  placeholder={dictionary.generator.carouselSlideContextPlaceholder}
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <AutoFieldButton
              isLoading={input.autoFieldKey === "carouselSlideContexts"}
              idleLabel={dictionary.generator.autoGenerateField}
              loadingLabel={dictionary.generator.autoGeneratingField}
              onClick={() => input.onGenerateField("carouselSlideContexts")}
            />
          </div>

          <button
            type="button"
            onClick={() => input.setCarouselSlideContexts(createSlideContexts(input.carouselSlideCount))}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
          >
            {dictionary.generator.restoreCarouselStructure}
          </button>
        </div>
      ) : null}

      {input.postType === "story" ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-ink">{dictionary.generator.storyMode}</p>
          <p className="mt-1 text-sm text-slate-600">{dictionary.generator.storyModeDescription}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["image-only", "with-caption"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => input.setStoryCaptionMode(mode)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  input.storyCaptionMode === mode
                    ? "border-ink bg-white text-ink shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {mode === "image-only"
                    ? dictionary.generator.storyModeImageOnly
                    : dictionary.generator.storyModeWithCaption}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block text-sm font-medium text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <span>{dictionary.generator.keywords}</span>
          <AutoFieldButton
            isLoading={input.autoFieldKey === "keywords"}
            idleLabel={dictionary.generator.autoGenerateField}
            loadingLabel={dictionary.generator.autoGeneratingField}
            onClick={() => input.onGenerateField("keywords")}
          />
        </div>
        <input
          value={input.keywords}
          onChange={(event) => input.setKeywords(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          placeholder={dictionary.generator.keywordsPlaceholder}
        />
        <span className="mt-2 block text-xs text-slate-500">{dictionary.generator.autoGenerateHint}</span>
      </label>
    </>
  );
}
