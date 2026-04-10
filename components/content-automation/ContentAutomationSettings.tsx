"use client";

import { useState, useTransition, useMemo } from "react";
import { useI18n } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Panel } from "@/components/shared";
import { DEFAULT_CUSTOM_INSTRUCTIONS } from "@/components/create-post/constants";
import type { OutputLanguage } from "@/components/create-post/types";
import { useContentAutomation } from "@/hooks/useContentAutomation";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import {
  generateAutomaticSetting as generateAutomaticSettingService,
  generateAutomaticSettingsBundle as generateAutomaticSettingsBundleService
} from "@/services/frontend/content-system";
import { saveGenerationSettings as saveGenerationSettingsService } from "@/services/frontend/user";
import type { DayLabel, Props } from "./types";
import { DAY_ORDER } from "./utils";

function renderAgendaMeta(label: string, value: string) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function parseTextareaItems(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function togglePresetInTextarea(currentValue: string, preset: string) {
  const normalizedPreset = preset.trim();

  if (!normalizedPreset) {
    return currentValue;
  }

  const nextItems = parseTextareaItems(currentValue);
  const hasPreset = nextItems.includes(normalizedPreset);

  return hasPreset
    ? nextItems.filter((item) => item !== normalizedPreset).join("\n")
    : [...nextItems, normalizedPreset].join("\n");
}

export function ContentAutomationSettings({
  initialProfile,
  initialAgenda,
  initialTopicsHistory,
  initialTab = "agenda",
  initialOutputLanguage = "en",
  initialCustomInstructions = DEFAULT_CUSTOM_INSTRUCTIONS
}: Props) {
  const { dictionary } = useI18n();
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>(initialOutputLanguage);
  const [customInstructions, setCustomInstructions] = useState(initialCustomInstructions);
  const [generationSettingsMessage, setGenerationSettingsMessage] = useState<string | null>(null);
  const [isSavingGenerationSettings, startSavingGenerationSettings] = useTransition();
  const [autoSettingKey, setAutoSettingKey] = useState<string | null>(null);
  const [isAutoGeneratingAllSettings, startAutoGeneratingAllSettings] = useTransition();
  const [expandedDays, setExpandedDays] = useState<Record<DayLabel, boolean>>(
    Object.fromEntries(DAY_ORDER.map((day, index) => [day, index === 0])) as Record<
      DayLabel,
      boolean
    >
  );
  const [openPresetPicker, setOpenPresetPicker] = useState<string | null>(null);
  const {
    brandName,
    setBrandName,
    editableBrief,
    setEditableBrief,
    automationLoopEnabled,
    setAutomationLoopEnabled,
    topicsHistoryCleanupFrequency,
    setTopicsHistoryCleanupFrequency,
    services,
    setServices,
    carouselDefaultStructure,
    setCarouselDefaultStructure,
    contentRules,
    setContentRules,
    researchQueries,
    setResearchQueries,
    presets,
    updatePreset,
    builtProfile,
    daySettings,
    agenda,
    currentTopics,
    message,
    error,
    setError,
    isSaving,
    isGenerating,
    autoFillKey,
    uniqueTopicsHistory,
    updateDay,
    updateDayPostIdea,
    updateDayPostTime,
    generateAutomaticPostIdea,
    toggleDay,
    setAllDaysEnabled,
    saveSettings,
    generateWeeklyAgenda,
    clearTopicsHistory
  } = useContentAutomation({
    initialProfile,
    initialAgenda,
    initialTopicsHistory,
    dictionary: {
      saveSuccess: dictionary.contentAutomation.saveSuccess,
      saveError: dictionary.contentAutomation.saveError,
      generateSuccess: dictionary.contentAutomation.generateSuccess,
      generateError: dictionary.contentAutomation.generateError,
      clearTopicsHistorySuccess: dictionary.contentAutomation.clearTopicsHistorySuccess,
      clearTopicsHistoryError: dictionary.contentAutomation.clearTopicsHistoryError
    }
  });

  const groupedAgenda = useMemo(() => {
    type AgendaGroup = (typeof agenda)[number] & {
      items: typeof agenda;
    };

    const groups = new Map<
      string,
      AgendaGroup
    >();

    for (const item of agenda) {
      const key = `${item.date}-${item.day}`;
      const current = groups.get(key);

      if (current) {
        current.items.push(item);
      } else {
        groups.set(key, {
          ...item,
          day: item.day,
          date: item.date,
          items: [item]
        });
      }
    }

    return Array.from(groups.values());
  }, [agenda]);

  const goalPresetItems = useMemo(() => parseTextareaItems(presets.goalPresets), [presets.goalPresets]);
  const contentTypePresetItems = useMemo(
    () => parseTextareaItems(presets.contentTypePresets),
    [presets.contentTypePresets]
  );
  const formatPresetItems = useMemo(
    () => parseTextareaItems(presets.formatPresets),
    [presets.formatPresets]
  );
  const postTimesByDay = useMemo(
    () =>
      Object.fromEntries(
        DAY_ORDER.map((day) => [day, parseTextareaItems(daySettings[day].postTimes)])
      ) as Record<DayLabel, string[]>,
    [daySettings]
  );

  function toggleExpandedDay(day: DayLabel) {
    setExpandedDays((current) => ({
      ...current,
      [day]: !current[day]
    }));
  }

  function togglePresetPicker(key: string) {
    setOpenPresetPicker((current) => (current === key ? null : key));
  }

  function renderPresetPicker(input: {
    pickerKey: string;
    presetsList: string[];
    value: string;
    onAuto: () => Promise<void> | void;
    onSelectPreset: (preset: string) => void;
    multiselect?: boolean;
  }) {
    const isOpen = openPresetPicker === input.pickerKey;
    const selectedItems = parseTextareaItems(input.value);
    const isAutoLoading = autoFillKey === input.pickerKey.split("-").slice(0, 2).join("-");

    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => togglePresetPicker(input.pickerKey)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
          aria-label={dictionary.contentAutomation.chooseSavedPreset}
        >
          +
        </button>

        {isOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {dictionary.contentAutomation.chooseSavedPreset}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isAutoLoading}
                onClick={() => {
                  void Promise.resolve(input.onAuto()).then(() => {
                    setOpenPresetPicker(null);
                  });
                }}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  selectedItems.length === 0 && !input.value.trim()
                    ? "border-ink bg-ink text-white"
                    : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-ink"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isAutoLoading
                  ? dictionary.contentAutomation.autoGeneratingField
                  : dictionary.contentAutomation.autoGenerateField}
              </button>

              {input.presetsList.map((preset) => {
                const isSelected = input.multiselect
                  ? selectedItems.includes(preset)
                  : input.value.trim() === preset;

                return (
                  <button
                    key={`${input.pickerKey}-${preset}`}
                    type="button"
                    onClick={() => {
                      input.onSelectPreset(preset);
                      if (!input.multiselect) {
                        setOpenPresetPicker(null);
                      }
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "border-ink bg-ink text-white"
                        : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-ink"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {input.presetsList.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                {dictionary.contentAutomation.noSavedPresets}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  function saveGenerationSettings() {
    setGenerationSettingsMessage(null);

    startSavingGenerationSettings(async () => {
      try {
        const json = await saveGenerationSettingsService({
          outputLanguage,
          customInstructions
        });

        if (json.outputLanguage) {
          setOutputLanguage(json.outputLanguage);
        }

        if (typeof json.customInstructions === "string") {
          setCustomInstructions(json.customInstructions || DEFAULT_CUSTOM_INSTRUCTIONS);
        }

        setGenerationSettingsMessage(dictionary.generator.settingsSaved);
      } catch (requestError) {
        setError(
          getClientRequestErrorMessage(
            requestError,
            dictionary.generator.settingsSaveError,
            dictionary.common.serverConnectionError
          )
        );
      }
    });
  }

  function renderAutoButton(
    key: string,
    onClick: () => Promise<void> | void
  ) {
    const isLoading = autoSettingKey === key;

    return (
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          void Promise.resolve(onClick());
        }}
        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? dictionary.contentAutomation.autoGeneratingField
          : dictionary.contentAutomation.autoGenerateField}
      </button>
    );
  }

  async function generateAutomaticSetting(input: {
    key: string;
    target:
      | "brandName"
      | "editableBrief"
      | "services"
      | "contentRules"
      | "researchQueries"
      | "carouselDefaultStructure"
      | "goalPresets"
      | "contentTypePresets"
      | "formatPresets"
      | "customInstructions";
    currentValue: string;
    apply: (value: string) => void;
  }) {
    setGenerationSettingsMessage(null);
    setError(null);
    setAutoSettingKey(input.key);

    try {
      const json = await generateAutomaticSettingService({
        profile: builtProfile,
        target: input.target,
        currentValue: input.currentValue
      });

      if (!json.value) {
        throw new Error(dictionary.contentAutomation.generateError);
      }

      input.apply(json.value);
    } catch (requestError) {
      setError(
        getClientRequestErrorMessage(
          requestError,
          dictionary.contentAutomation.generateError,
          dictionary.common.serverConnectionError
        )
      );
    } finally {
      setAutoSettingKey((current) => (current === input.key ? null : current));
    }
  }

  function generateAutomaticSettingsBundle() {
    setGenerationSettingsMessage(null);
    setError(null);

    startAutoGeneratingAllSettings(async () => {
      try {
        const json = await generateAutomaticSettingsBundleService({
          profile: builtProfile,
          customInstructions
        });

        setBrandName(json.brandName ?? brandName);
        setEditableBrief(json.editableBrief ?? editableBrief);
        setServices(json.services ?? services);
        setContentRules(json.contentRules ?? contentRules);
        setResearchQueries(json.researchQueries ?? researchQueries);
        setCarouselDefaultStructure(
          json.carouselDefaultStructure ?? carouselDefaultStructure
        );
        updatePreset("goalPresets", json.goalPresets ?? presets.goalPresets);
        updatePreset(
          "contentTypePresets",
          json.contentTypePresets ?? presets.contentTypePresets
        );
        updatePreset("formatPresets", json.formatPresets ?? presets.formatPresets);
        setCustomInstructions(json.customInstructions ?? customInstructions);
      } catch (requestError) {
        setError(
          getClientRequestErrorMessage(
            requestError,
            dictionary.contentAutomation.generateError,
            dictionary.common.serverConnectionError
          )
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={
            error
              ? "rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          }
        >
          {error ?? message}
        </div>
      )}

      {initialTab === "settings" ? (
      <div className="grid gap-6">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {dictionary.generator.outputLanguage}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.generator.outputLanguageDescription}
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOutputLanguage("en")}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  outputLanguage === "en"
                    ? "border-ink bg-white text-ink shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {dictionary.generator.outputLanguageEnglish}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOutputLanguage("pt-BR")}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  outputLanguage === "pt-BR"
                    ? "border-ink bg-white text-ink shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {dictionary.generator.outputLanguagePtBR}
                </span>
              </button>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {dictionary.generator.customInstructions}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {dictionary.generator.customInstructionsDescription}
                </p>
              </div>
              {renderAutoButton("customInstructions", () =>
                generateAutomaticSetting({
                  key: "customInstructions",
                  target: "customInstructions",
                  currentValue: customInstructions,
                  apply: setCustomInstructions
                })
              )}
            </div>
          </div>
          <div className="p-6">
            <textarea
              value={customInstructions}
              onChange={(event) => setCustomInstructions(event.target.value)}
              className="min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              placeholder={dictionary.generator.customInstructionsPlaceholder}
            />
            <button
              type="button"
              onClick={() => setCustomInstructions(DEFAULT_CUSTOM_INSTRUCTIONS)}
              className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              {dictionary.generator.restoreDefaultInstructions}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              {dictionary.contentAutomation.autoGenerateSectionHint}
            </p>
          </div>
        </Panel>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generateAutomaticSettingsBundle}
            disabled={isAutoGeneratingAllSettings}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAutoGeneratingAllSettings
              ? dictionary.contentAutomation.autoGeneratingField
              : dictionary.contentAutomation.autoGenerateAll}
          </button>
          <button
            type="button"
            onClick={saveGenerationSettings}
            disabled={isSavingGenerationSettings}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingGenerationSettings
              ? dictionary.generator.generating
              : dictionary.common.save}
          </button>
          {generationSettingsMessage ? (
            <p className="text-sm text-emerald-700">{generationSettingsMessage}</p>
          ) : null}
        </div>
      </div>
      ) : null}

      {initialTab === "settings" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.strategySection}
          </p>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {dictionary.contentAutomation.strategyDescription}
          </p>
        </div>
        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{dictionary.contentAutomation.brandName}</span>
                  {renderAutoButton("brandName", () =>
                    generateAutomaticSetting({
                      key: "brandName",
                      target: "brandName",
                      currentValue: brandName,
                      apply: setBrandName
                    })
                  )}
                </div>
                <input
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{dictionary.contentAutomation.editableBrief}</span>
                  {renderAutoButton("editableBrief", () =>
                    generateAutomaticSetting({
                      key: "editableBrief",
                      target: "editableBrief",
                      currentValue: editableBrief,
                      apply: setEditableBrief
                    })
                  )}
                </div>
                <textarea
                  value={editableBrief}
                  onChange={(event) => setEditableBrief(event.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={automationLoopEnabled}
                  onChange={(event) => setAutomationLoopEnabled(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-ink focus:ring-ink"
                />
                <span>
                  <span className="block font-semibold text-ink">
                    {dictionary.contentAutomation.automationLoopEnabled}
                  </span>
                  <span className="mt-1 block text-slate-600">
                    {dictionary.contentAutomation.automationLoopDescription}
                  </span>
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <span>{dictionary.contentAutomation.topicsHistoryCleanupFrequency}</span>
                <select
                  value={topicsHistoryCleanupFrequency}
                  onChange={(event) =>
                    setTopicsHistoryCleanupFrequency(
                      event.target.value as "disabled" | "daily" | "weekly" | "monthly"
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                >
                  <option value="disabled">
                    {dictionary.contentAutomation.cleanupFrequencyDisabled}
                  </option>
                  <option value="daily">
                    {dictionary.contentAutomation.cleanupFrequencyDaily}
                  </option>
                  <option value="weekly">
                    {dictionary.contentAutomation.cleanupFrequencyWeekly}
                  </option>
                  <option value="monthly">
                    {dictionary.contentAutomation.cleanupFrequencyMonthly}
                  </option>
                </select>
                <span className="mt-2 block text-sm text-slate-600">
                  {dictionary.contentAutomation.topicsHistoryCleanupDescription}
                </span>
              </label>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-ink">
                {dictionary.contentAutomation.howItWorksTitle}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {dictionary.contentAutomation.howItWorksDescription}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {dictionary.contentAutomation.scheduleLabel}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {dictionary.contentAutomation.scheduleDescription}
              </p>
            </div>
          </div>
        </div>
      </Panel>
      ) : null}

      {initialTab === "settings" ? (
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {dictionary.contentAutomation.sourcesSection}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.sourcesDescription}
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{dictionary.contentAutomation.services}</span>
                  {renderAutoButton("services", () =>
                    generateAutomaticSetting({
                      key: "services",
                      target: "services",
                      currentValue: services,
                      apply: setServices
                    })
                  )}
                </div>
                <textarea
                  value={services}
                  onChange={(event) => setServices(event.target.value)}
                  rows={8}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{dictionary.contentAutomation.contentRules}</span>
                  {renderAutoButton("contentRules", () =>
                    generateAutomaticSetting({
                      key: "contentRules",
                      target: "contentRules",
                      currentValue: contentRules,
                      apply: setContentRules
                    })
                  )}
                </div>
                <textarea
                  value={contentRules}
                  onChange={(event) => setContentRules(event.target.value)}
                  rows={8}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{dictionary.contentAutomation.researchQueries}</span>
                  {renderAutoButton("researchQueries", () =>
                    generateAutomaticSetting({
                      key: "researchQueries",
                      target: "researchQueries",
                      currentValue: researchQueries,
                      apply: setResearchQueries
                    })
                  )}
                </div>
                <textarea
                  value={researchQueries}
                  onChange={(event) => setResearchQueries(event.target.value)}
                  rows={8}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{dictionary.contentAutomation.carouselDefaultStructure}</span>
                  {renderAutoButton("carouselDefaultStructure", () =>
                    generateAutomaticSetting({
                      key: "carouselDefaultStructure",
                      target: "carouselDefaultStructure",
                      currentValue: carouselDefaultStructure,
                      apply: setCarouselDefaultStructure
                    })
                  )}
                </div>
                <textarea
                  value={carouselDefaultStructure}
                  onChange={(event) => setCarouselDefaultStructure(event.target.value)}
                  rows={8}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-slate-500">{dictionary.contentAutomation.listHint}</p>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {dictionary.contentAutomation.automationSection}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.automationDescription}
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveSettings}
                disabled={isSaving || isGenerating}
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? dictionary.contentAutomation.saving
                  : dictionary.contentAutomation.saveButton}
              </button>
              <button
                type="button"
                onClick={generateWeeklyAgenda}
                disabled={isSaving || isGenerating}
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating
                  ? dictionary.contentAutomation.generating
                  : dictionary.contentAutomation.generateButton}
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {dictionary.contentAutomation.generateHint}
            </p>

            {currentTopics.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {dictionary.contentAutomation.currentTopics}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentTopics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
      ) : null}

      {initialTab === "settings" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.memorySection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.memoryDescription}
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {dictionary.contentAutomation.topicsHistoryTitle}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {dictionary.contentAutomation.topicsHistoryDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={clearTopicsHistory}
              disabled={isSaving || isGenerating}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {dictionary.contentAutomation.clearTopicsHistory}
            </button>
          </div>

          {uniqueTopicsHistory.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              {dictionary.contentAutomation.noTopicsHistory}
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              {uniqueTopicsHistory.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </Panel>
      ) : null}

      {initialTab === "agenda" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.automationSection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.automationDescription}
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving || isGenerating}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? dictionary.contentAutomation.saving
                : dictionary.contentAutomation.saveButton}
            </button>
            <button
              type="button"
              onClick={generateWeeklyAgenda}
              disabled={isSaving || isGenerating}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating
                ? dictionary.contentAutomation.generating
                : dictionary.contentAutomation.generateButton}
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            {dictionary.contentAutomation.generateHint}
          </p>

          {currentTopics.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {dictionary.contentAutomation.currentTopics}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
      ) : null}

      {initialTab === "agenda" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.agendaRulesSection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.agendaRulesDescription}
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">
                {dictionary.contentAutomation.weeklyAgendaTitle}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {dictionary.contentAutomation.weeklyAgendaDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAllDaysEnabled(true)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
              >
                {dictionary.contentAutomation.enableAllDays}
              </button>
              <button
                type="button"
                onClick={() => setAllDaysEnabled(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
              >
                {dictionary.contentAutomation.disableAllDays}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {DAY_ORDER.map((day) => (
              <div key={day} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-ink">{day}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {daySettings[day].enabled
                        ? `${daySettings[day].postsPerDay} ${dictionary.contentAutomation.dayPostsSummary}`
                        : dictionary.contentAutomation.dayDisabledSummary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpandedDay(day)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
                  >
                    {expandedDays[day]
                      ? dictionary.contentAutomation.showLessDay
                      : dictionary.contentAutomation.showMoreDay}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={daySettings[day].enabled}
                    onChange={(event) => toggleDay(day, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-ink focus:ring-ink"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {dictionary.contentAutomation.dayEnabled}
                  </span>
                </div>

                {expandedDays[day] ? (
                  <>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700">
                        <span>{dictionary.contentAutomation.postsPerDay}</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={daySettings[day].postsPerDay}
                          onChange={(event) => updateDay(day, "postsPerDay", event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                        />
                      </label>
                    </div>

                    <div className="mt-4 space-y-4">
                      {daySettings[day].postIdeas.map((idea, index) => (
                        <div
                          key={`${day}-idea-${index}`}
                          className="rounded-3xl border border-slate-200 bg-white p-5"
                        >
                          <p className="text-sm font-semibold text-ink">
                            {dictionary.contentAutomation.postLabel} {index + 1}
                          </p>

                          <label className="mt-4 block text-sm font-medium text-slate-700">
                            <span>{dictionary.contentAutomation.postTimes}</span>
                            <input
                              type="time"
                              value={postTimesByDay[day][index] ?? ""}
                              onChange={(event) =>
                                updateDayPostTime(day, index, event.target.value)
                              }
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                            />
                            <span className="mt-2 block text-xs text-slate-500">
                              {dictionary.contentAutomation.postTimesHint}
                            </span>
                          </label>

                          <label className="mt-4 block text-sm font-medium text-slate-700">
                            <div className="flex items-center justify-between gap-3">
                              <span>{dictionary.contentAutomation.dayGoal}</span>
                              {renderPresetPicker({
                                pickerKey: `${day}-${index}-goal`,
                                presetsList: goalPresetItems,
                                value: idea.goal,
                                onAuto: () => generateAutomaticPostIdea(day, index),
                                onSelectPreset: (preset) =>
                                  updateDayPostIdea(day, index, "goal", preset)
                              })}
                            </div>
                            <textarea
                              value={idea.goal}
                              onChange={(event) =>
                                updateDayPostIdea(day, index, "goal", event.target.value)
                              }
                              rows={3}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                            />
                            <span className="mt-2 block text-xs text-slate-500">
                              {dictionary.contentAutomation.autoGenerateHint}
                            </span>
                          </label>

                          <label className="mt-4 block text-sm font-medium text-slate-700">
                            <div className="flex items-center justify-between gap-3">
                              <span>{dictionary.contentAutomation.dayTypes}</span>
                              {renderPresetPicker({
                                pickerKey: `${day}-${index}-types`,
                                presetsList: contentTypePresetItems,
                                value: idea.contentTypes,
                                multiselect: true,
                                onAuto: () => generateAutomaticPostIdea(day, index),
                                onSelectPreset: (preset) =>
                                  updateDayPostIdea(
                                    day,
                                    index,
                                    "contentTypes",
                                    togglePresetInTextarea(idea.contentTypes, preset)
                                  )
                              })}
                            </div>
                            <textarea
                              value={idea.contentTypes}
                              onChange={(event) =>
                                updateDayPostIdea(day, index, "contentTypes", event.target.value)
                              }
                              rows={4}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                            />
                            <span className="mt-2 block text-xs text-slate-500">
                              {dictionary.contentAutomation.autoGenerateHint}
                            </span>
                          </label>

                          <label className="mt-4 block text-sm font-medium text-slate-700">
                            <div className="flex items-center justify-between gap-3">
                              <span>{dictionary.contentAutomation.dayFormats}</span>
                              {renderPresetPicker({
                                pickerKey: `${day}-${index}-formats`,
                                presetsList: formatPresetItems,
                                value: idea.formats,
                                multiselect: true,
                                onAuto: () => generateAutomaticPostIdea(day, index),
                                onSelectPreset: (preset) =>
                                  updateDayPostIdea(
                                    day,
                                    index,
                                    "formats",
                                    togglePresetInTextarea(idea.formats, preset)
                                  )
                              })}
                            </div>
                            <textarea
                              value={idea.formats}
                              onChange={(event) =>
                                updateDayPostIdea(day, index, "formats", event.target.value)
                              }
                              rows={3}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                            />
                            <span className="mt-2 block text-xs text-slate-500">
                              {dictionary.contentAutomation.autoGenerateHint}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {dictionary.contentAutomation.dayGoal}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {daySettings[day].postIdeas[0]?.goal || dictionary.contentAutomation.noDayGoal}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Panel>
      ) : null}

      {initialTab === "settings" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.settingsTab}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.presetLibraryDescription}
          </p>
        </div>
        <div className="p-6">
          <LanguageSwitcher />
        </div>
      </Panel>
      ) : null}

      {initialTab === "settings" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.presetLibraryTitle}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.presetLibraryDescription}
          </p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.contentAutomation.goalPresets}</span>
                {renderAutoButton("goalPresets", () =>
                  generateAutomaticSetting({
                    key: "goalPresets",
                    target: "goalPresets",
                    currentValue: presets.goalPresets,
                    apply: (value) => updatePreset("goalPresets", value)
                  })
                )}
              </div>
              <textarea
                value={presets.goalPresets}
                onChange={(event) => updatePreset("goalPresets", event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.contentAutomation.contentTypePresets}</span>
                {renderAutoButton("contentTypePresets", () =>
                  generateAutomaticSetting({
                    key: "contentTypePresets",
                    target: "contentTypePresets",
                    currentValue: presets.contentTypePresets,
                    apply: (value) => updatePreset("contentTypePresets", value)
                  })
                )}
              </div>
              <textarea
                value={presets.contentTypePresets}
                onChange={(event) => updatePreset("contentTypePresets", event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.contentAutomation.formatPresets}</span>
                {renderAutoButton("formatPresets", () =>
                  generateAutomaticSetting({
                    key: "formatPresets",
                    target: "formatPresets",
                    currentValue: presets.formatPresets,
                    apply: (value) => updatePreset("formatPresets", value)
                  })
                )}
              </div>
              <textarea
                value={presets.formatPresets}
                onChange={(event) => updatePreset("formatPresets", event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {dictionary.contentAutomation.savedPresetsHint}
          </p>
        </div>
      </Panel>
      ) : null}

      {initialTab === "agenda" ? (
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.generatedSection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.generatedDescription}
          </p>
        </div>
        <div className="p-6">
          <p className="text-sm font-semibold text-ink">
            {dictionary.contentAutomation.generatedAgendaTitle}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.generatedAgendaDescription}
          </p>

          {agenda.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">{dictionary.contentAutomation.noAgenda}</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {groupedAgenda.map((item) => (
                <div
                  key={`${item.date}-${item.day}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    <span>{item.day}</span>
                    <span>{item.date}</span>
                    <span>
                      {item.items.length}{" "}
                      {item.items.length === 1
                        ? dictionary.contentAutomation.singlePostLabel
                        : dictionary.contentAutomation.multiplePostsLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-ink">{item.theme}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.type} · {item.goal}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {renderAgendaMeta(dictionary.contentAutomation.dayGoal, item.goal)}
                    {renderAgendaMeta(dictionary.contentAutomation.dayTypes, item.type)}
                    {renderAgendaMeta(dictionary.contentAutomation.dayFormats, item.format)}
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {dictionary.contentAutomation.structure}
                      </p>
                      <div className="mt-2 space-y-2 text-sm text-slate-600">
                        {item.structure.map((step, index) => (
                          <p key={`${item.date}-${item.time}-${index}`}>
                            {index + 1}. {step}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {dictionary.common.caption}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {item.caption}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {dictionary.contentAutomation.visualIdea}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{item.visualIdea}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          CTA
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{item.cta}</p>
                      </div>
                    </div>
                  </div>
                  {item.items.length > 1 ? (
                    <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                      {item.items.slice(1).map((post, index) => (
                        <div
                          key={`${post.date}-${post.time}-${post.theme}`}
                          className="rounded-3xl border border-slate-200 bg-white p-5"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            <span>{dictionary.contentAutomation.postLabel}</span>
                            <span>{index + 2}</span>
                            <span>{post.time}</span>
                            <span>{post.format}</span>
                          </div>
                          <h3 className="mt-3 text-xl font-semibold text-ink">{post.theme}</h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {post.type} · {post.goal}
                          </p>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {renderAgendaMeta(dictionary.contentAutomation.dayGoal, post.goal)}
                            {renderAgendaMeta(dictionary.contentAutomation.dayTypes, post.type)}
                            {renderAgendaMeta(dictionary.contentAutomation.dayFormats, post.format)}
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                {dictionary.contentAutomation.structure}
                              </p>
                              <div className="mt-2 space-y-2 text-sm text-slate-600">
                                {post.structure.map((step, stepIndex) => (
                                  <p key={`${post.date}-${post.time}-${stepIndex}`}>
                                    {stepIndex + 1}. {step}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                {dictionary.common.caption}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                {post.caption}
                              </p>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  {dictionary.contentAutomation.visualIdea}
                                </p>
                                <p className="mt-2 text-sm text-slate-600">{post.visualIdea}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  CTA
                                </p>
                                <p className="mt-2 text-sm text-slate-600">{post.cta}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
      ) : null}
    </div>
  );
}
