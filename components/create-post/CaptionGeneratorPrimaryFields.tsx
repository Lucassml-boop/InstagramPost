"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  getBrandColorsHistoryLabel,
  getBrandColorsSwatches,
  parseBrandColors,
  serializeBrandColors
} from "./utils";
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
  setBrandColors: Dispatch<SetStateAction<string>>;
  brandColorsHistory: string[];
  saveBrandColorsToHistory: () => void;
  removeBrandColorsFromHistory: (value: string) => void;
  onGenerateField: (field: "topic" | "message") => void;
}) {
  const { dictionary } = input;
  const palette = parseBrandColors(input.brandColors);
  const [optionalFieldsVisible, setOptionalFieldsVisible] = useState(0);

  function updateBrandColorField(
    role: "primary" | "background" | "support" | "accent",
    value: string
  ) {
    input.setBrandColors((current) =>
      serializeBrandColors({
        ...parseBrandColors(current),
        [role]: value
      })
    );
  }

  function removeOptionalColor(role: "support" | "accent") {
    updateBrandColorField(role, "");
    setOptionalFieldsVisible((current) => (role === "accent" ? Math.min(current, 1) : 0));
  }

  const visibleFields = [
    {
      key: "primary" as const,
      label: dictionary.generator.brandColorPrimary ?? "Cor principal",
      description:
        dictionary.generator.brandColorPrimaryHint ?? "Cor dominante do layout."
    },
    {
      key: "background" as const,
      label: dictionary.generator.brandColorBackground ?? "Cor de fundo",
      description:
        dictionary.generator.brandColorBackgroundHint ?? "Base neutra para o post."
    },
    ...(optionalFieldsVisible >= 1
      ? [
          {
            key: "support" as const,
            label: dictionary.generator.brandColorSupport ?? "Cor de apoio",
            description:
              dictionary.generator.brandColorSupportHint ?? "Secundaria para contraste e profundidade."
          }
        ]
      : []),
    ...(optionalFieldsVisible >= 2
      ? [
          {
            key: "accent" as const,
            label: dictionary.generator.brandColorAccent ?? "Cor de destaque",
            description:
              dictionary.generator.brandColorAccentHint ?? "Opcional para CTAs e detalhes."
          }
        ]
      : [])
  ];

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
          <div className="mt-2 grid gap-3">
            {visibleFields.map((field) => (
              <div
                key={field.key}
                className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1fr]"
              >
                <input
                  type="color"
                  value={(palette[field.key] || "#000000").startsWith("#") ? palette[field.key] || "#000000" : "#000000"}
                  onChange={(event) => updateBrandColorField(field.key, event.target.value)}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white sm:w-16"
                  aria-label={field.label}
                />
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{field.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{field.description}</span>
                      {(field.key === "support" || field.key === "accent") ? (
                        <button
                          type="button"
                          onClick={() => removeOptionalColor(field.key)}
                          className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
                        >
                          {dictionary.common.remove}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <input
                    value={palette[field.key]}
                    onChange={(event) => updateBrandColorField(field.key, event.target.value)}
                    onBlur={() => input.saveBrandColorsToHistory()}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-slate-400"
                    placeholder={
                      field.key === "primary"
                        ? "#ff751f"
                        : field.key === "background"
                          ? "#1a1a1a"
                          : field.key === "support"
                            ? "#ff9a56"
                            : "#fff4cc"
                    }
                  />
                </div>
              </div>
            ))}
            {optionalFieldsVisible < 2 ? (
              <button
                type="button"
                onClick={() => setOptionalFieldsVisible((current) => Math.min(current + 1, 2))}
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
              >
                <span className="text-base leading-none">+</span>
                <span>
                  {optionalFieldsVisible === 0
                    ? dictionary.generator.addSupportColor ?? "Adicionar cor de apoio"
                    : dictionary.generator.addAccentColor ?? "Adicionar cor de destaque"}
                </span>
              </button>
            ) : null}
          </div>
          <span className="mt-2 block text-xs text-slate-500">{dictionary.generator.brandColorsHint}</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {input.brandColorsHistory.map((palette) => (
              <div
                key={palette}
                className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${
                  palette === input.brandColors
                    ? "border-ink bg-ink text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-ink"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => input.setBrandColors(palette)}
                    className="flex items-center gap-2"
                  >
                    <span className="flex items-center gap-1">
                      {getBrandColorsSwatches(palette).slice(0, 4).map((swatch) => (
                        <span
                          key={`${palette}-${swatch}`}
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </span>
                    <span>{getBrandColorsHistoryLabel(palette) || palette}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => input.removeBrandColorsFromHistory(palette)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      palette === input.brandColors
                        ? "border-white/40 text-white hover:border-white hover:text-white"
                        : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-ink"
                    }`}
                  >
                    {dictionary.common.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </label>
      </div>
    </>
  );
}
