import { useEffect, useState } from "react";
import {
  getBrandColorsHistoryLabel,
  getBrandColorsSwatches,
  parseBrandColors,
  serializeBrandColors
} from "@/components/create-post/utils";
import { Panel } from "@/components/shared";
import type { SettingsSectionsProps } from "./types";

export function StrategySection(props: SettingsSectionsProps) {
  const { dictionary } = props;
  const palette = parseBrandColors(props.brandColors);
  const [optionalFieldsVisible, setOptionalFieldsVisible] = useState(0);

  useEffect(() => {
    if (!palette.support && !palette.accent) {
      return;
    }

    setOptionalFieldsVisible(palette.accent ? 2 : 1);
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

  const visibleFields = [
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
      ? [
          {
            key: "support" as const,
            label: dictionary.generator.brandColorSupport ?? "Cor de apoio",
            description:
              dictionary.generator.brandColorSupportHint ??
              "Secundaria para contraste e profundidade."
          }
        ]
      : []),
    ...(optionalFieldsVisible >= 2
      ? [
          {
            key: "accent" as const,
            label: dictionary.generator.brandColorAccent ?? "Cor de destaque",
            description:
              dictionary.generator.brandColorAccentHint ??
              "Opcional para CTAs e elementos de foco."
          }
        ]
      : [])
  ];

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.strategySection}</p>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{dictionary.contentAutomation.strategyDescription}</p>
      </div>
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.contentAutomation.brandName}</span>
                {props.renderAutoButton("brandName", () => props.runAutomaticSetting({ key: "brandName", target: "brandName", currentValue: props.brandName, apply: props.setBrandName }))}
              </div>
              <input value={props.brandName} onChange={(event) => props.setBrandName(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.contentAutomation.editableBrief}</span>
                {props.renderAutoButton("editableBrief", () => props.runAutomaticSetting({ key: "editableBrief", target: "editableBrief", currentValue: props.editableBrief, apply: props.setEditableBrief }))}
              </div>
              <textarea value={props.editableBrief} onChange={(event) => props.setEditableBrief(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" />
            </label>
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
                        ? "Adicionar cor de apoio"
                        : "Adicionar cor de destaque"}
                    </span>
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
                      <button
                        type="button"
                        onClick={() => props.setBrandColors(savedPalette)}
                        className="flex items-center gap-2"
                      >
                        <span className="flex items-center gap-1">
                          {getBrandColorsSwatches(savedPalette)
                            .slice(0, 4)
                            .map((swatch) => (
                              <span
                                key={`${savedPalette}-${swatch}`}
                                className="h-3 w-3 rounded-full border border-black/10"
                                style={{ backgroundColor: swatch }}
                              />
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
            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input type="checkbox" checked={props.automationLoopEnabled} onChange={(event) => props.setAutomationLoopEnabled(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-ink focus:ring-ink" />
              <span><span className="block font-semibold text-ink">{dictionary.contentAutomation.automationLoopEnabled}</span><span className="mt-1 block text-slate-600">{dictionary.contentAutomation.automationLoopDescription}</span></span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.topicsHistoryCleanupFrequency}</span>
              <select value={props.topicsHistoryCleanupFrequency} onChange={(event) => props.setTopicsHistoryCleanupFrequency(event.target.value as "disabled" | "daily" | "weekly" | "monthly")} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400">
                <option value="disabled">{dictionary.contentAutomation.cleanupFrequencyDisabled}</option>
                <option value="daily">{dictionary.contentAutomation.cleanupFrequencyDaily}</option>
                <option value="weekly">{dictionary.contentAutomation.cleanupFrequencyWeekly}</option>
                <option value="monthly">{dictionary.contentAutomation.cleanupFrequencyMonthly}</option>
              </select>
              <span className="mt-2 block text-sm text-slate-600">{dictionary.contentAutomation.topicsHistoryCleanupDescription}</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.generationRigorLabel}</span>
              <select
                value={props.generationRigor}
                onChange={(event) =>
                  props.setGenerationRigor(
                    event.target.value as "strict" | "balanced" | "flexible"
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              >
                <option value="strict">{dictionary.contentAutomation.generationRigorStrict}</option>
                <option value="balanced">{dictionary.contentAutomation.generationRigorBalanced}</option>
                <option value="flexible">{dictionary.contentAutomation.generationRigorFlexible}</option>
              </select>
              <span className="mt-2 block text-sm text-slate-600">
                {dictionary.contentAutomation.generationRigorDescription}
              </span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.historyLookbackDaysLabel}</span>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>1</span>
                  <span>{props.historyLookbackDays} dias</span>
                  <span>365</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={365}
                  step={1}
                  value={props.historyLookbackDays}
                  onChange={(event) => {
                    const nextValue = Number.parseInt(event.target.value, 10);
                    props.setHistoryLookbackDays(Number.isFinite(nextValue) ? nextValue : 60);
                  }}
                  className="w-full accent-slate-700"
                />
              </div>
              <span className="mt-2 block text-sm text-slate-600">
                {dictionary.contentAutomation.historyLookbackDaysDescription}
              </span>
            </label>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-ink">{dictionary.contentAutomation.howItWorksTitle}</p>
            <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.howItWorksDescription}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.scheduleLabel}</p>
            <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.scheduleDescription}</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
