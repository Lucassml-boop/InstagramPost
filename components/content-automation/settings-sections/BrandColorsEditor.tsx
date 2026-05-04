"use client";

import { useEffect, useState } from "react";
import {
  getBrandColorsHistoryLabel,
  getBrandColorsSwatches,
  parseBrandColors,
  serializeBrandColors
} from "@/components/create-post/utils";
import type { SettingsSectionsProps } from "./types";

export function BrandColorsEditor(props: Pick<
  SettingsSectionsProps,
  | "dictionary"
  | "brandColors"
  | "setBrandColors"
  | "brandColorsHistory"
  | "saveBrandColorsToHistory"
  | "removeBrandColorsFromHistory"
>) {
  const { dictionary } = props;
  const palette = parseBrandColors(props.brandColors);
  const [optionalFieldsVisible, setOptionalFieldsVisible] = useState(0);

  useEffect(() => {
    if (palette.support || palette.accent) setOptionalFieldsVisible(palette.accent ? 2 : 1);
  }, [palette.accent, palette.support]);

  function updateBrandColorField(
    role: "primary" | "background" | "support" | "accent",
    value: string
  ) {
    props.setBrandColors(
      serializeBrandColors({
        ...parseBrandColors(props.brandColors),
        [role]: value
      })
    );
  }

  function removeOptionalColor(role: "support" | "accent") {
    updateBrandColorField(role, "");
    setOptionalFieldsVisible((current) => (role === "accent" ? Math.min(current, 1) : 0));
  }

  const fields = [
    {
      key: "primary" as const,
      label: dictionary.generator.brandColorPrimary ?? "Cor principal",
      description: dictionary.generator.brandColorPrimaryHint ?? "Cor dominante do layout."
    },
    {
      key: "background" as const,
      label: dictionary.generator.brandColorBackground ?? "Cor de fundo",
      description: dictionary.generator.brandColorBackgroundHint ?? "Base neutra para o post."
    },
    ...(optionalFieldsVisible >= 1
      ? [{
          key: "support" as const,
          label: dictionary.generator.brandColorSupport ?? "Cor de apoio",
          description: dictionary.generator.brandColorSupportHint ?? "Secundaria para contraste e profundidade."
        }]
      : []),
    ...(optionalFieldsVisible >= 2
      ? [{
          key: "accent" as const,
          label: dictionary.generator.brandColorAccent ?? "Cor de destaque",
          description: dictionary.generator.brandColorAccentHint ?? "Opcional para CTAs e elementos de foco."
        }]
      : [])
  ];

  return (
    <label className="block text-sm font-medium text-slate-700">
      <div className="flex items-center justify-between gap-3">
        <span>{dictionary.generator.brandColors}</span>
        <button
          type="button"
          onClick={props.saveBrandColorsToHistory}
          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
        >
          {dictionary.common.save}
        </button>
      </div>
      <div className="mt-2 grid gap-3">
        {fields.map((field) => (
          <div key={field.key} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1fr]">
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
                  {field.key === "support" || field.key === "accent" ? (
                    <button
                      type="button"
                      onClick={() => removeOptionalColor(field.key)}
                      className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
              <input
                value={palette[field.key]}
                onChange={(event) => updateBrandColorField(field.key, event.target.value)}
                onBlur={props.saveBrandColorsToHistory}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-slate-400"
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
            <span>{optionalFieldsVisible === 0 ? "Adicionar cor de apoio" : "Adicionar cor de destaque"}</span>
          </button>
        ) : null}
      </div>
      <span className="mt-2 block text-xs text-slate-500">{dictionary.generator.brandColorsHint}</span>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.brandColorsHistory.map((savedPalette) => (
          <div
            key={savedPalette}
            className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${
              savedPalette === props.brandColors
                ? "border-ink bg-ink text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-ink"
            }`}
          >
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => props.setBrandColors(savedPalette)} className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  {getBrandColorsSwatches(savedPalette).slice(0, 4).map((swatch) => (
                    <span key={`${savedPalette}-${swatch}`} className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: swatch }} />
                  ))}
                </span>
                <span>{getBrandColorsHistoryLabel(savedPalette) || savedPalette}</span>
              </button>
              <button
                type="button"
                onClick={() => props.removeBrandColorsFromHistory(savedPalette)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  savedPalette === props.brandColors
                    ? "border-white/40 text-white hover:border-white hover:text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-ink"
                }`}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </label>
  );
}
