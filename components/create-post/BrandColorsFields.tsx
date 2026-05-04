"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { BrandColorsHistory } from "./BrandColorsHistory";
import { parseBrandColors, serializeBrandColors } from "./utils";

type BrandColorRole = "primary" | "background" | "support" | "accent";

export function BrandColorsFields(input: {
  dictionary: any;
  brandColors: string;
  setBrandColors: Dispatch<SetStateAction<string>>;
  brandColorsHistory: string[];
  saveBrandColorsToHistory: () => void;
  removeBrandColorsFromHistory: (value: string) => void;
}) {
  const { dictionary } = input;
  const palette = parseBrandColors(input.brandColors);
  const [optionalFieldsVisible, setOptionalFieldsVisible] = useState(0);

  useEffect(() => {
    if (!palette.support && !palette.accent) {
      return;
    }

    input.setBrandColors((current) => {
      const currentPalette = parseBrandColors(current);
      if (!currentPalette.support && !currentPalette.accent) {
        return current;
      }

      return serializeBrandColors({
        primary: currentPalette.primary,
        background: currentPalette.background,
        support: "",
        accent: ""
      });
    });
  }, []);

  function updateBrandColorField(role: BrandColorRole, value: string) {
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

  const visibleFields = getVisibleBrandColorFields(dictionary, optionalFieldsVisible);

  return (
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
          <BrandColorField
            key={field.key}
            dictionary={dictionary}
            field={field}
            value={palette[field.key]}
            onChange={(value) => updateBrandColorField(field.key, value)}
            onRemove={
              field.key === "support" || field.key === "accent"
                ? () => removeOptionalColor(field.key)
                : undefined
            }
            onSave={input.saveBrandColorsToHistory}
          />
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
      <BrandColorsHistory
        dictionary={dictionary}
        brandColors={input.brandColors}
        setBrandColors={input.setBrandColors}
        brandColorsHistory={input.brandColorsHistory}
        removeBrandColorsFromHistory={input.removeBrandColorsFromHistory}
      />
    </label>
  );
}

function getVisibleBrandColorFields(dictionary: any, optionalFieldsVisible: number) {
  return [
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
          description: dictionary.generator.brandColorAccentHint ?? "Opcional para CTAs e detalhes."
        }]
      : [])
  ];
}

function getBrandColorPlaceholder(role: BrandColorRole) {
  return role === "primary"
    ? "#ff751f"
    : role === "background"
      ? "#1a1a1a"
      : role === "support"
        ? "#ff9a56"
        : "#fff4cc";
}

function BrandColorField(input: {
  dictionary: any;
  field: ReturnType<typeof getVisibleBrandColorFields>[number];
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_1fr]">
      <input
        type="color"
        value={(input.value || "#000000").startsWith("#") ? input.value || "#000000" : "#000000"}
        onChange={(event) => input.onChange(event.target.value)}
        className="h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white sm:w-16"
        aria-label={input.field.label}
      />
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{input.field.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{input.field.description}</span>
            {input.onRemove ? (
              <button
                type="button"
                onClick={input.onRemove}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
              >
                {input.dictionary.common.remove}
              </button>
            ) : null}
          </div>
        </div>
        <input
          value={input.value}
          onChange={(event) => input.onChange(event.target.value)}
          onBlur={input.onSave}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-slate-400"
          placeholder={getBrandColorPlaceholder(input.field.key)}
        />
      </div>
    </div>
  );
}
