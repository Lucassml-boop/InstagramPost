"use client";

import { useMemo, useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { DEFAULT_CUSTOM_INSTRUCTIONS } from "@/components/create-post/constants";
import { renderStatusMessage, parseTextareaItems } from "@/components/content-automation/helpers";
import { useContentAutomation } from "@/hooks/useContentAutomation";
import { createEmptyBriefingFields, parseStoredCustomInstructions, serializeStoredCustomInstructions } from "@/lib/briefing-builder";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import { generateAutomaticSetting as generateAutomaticSettingService, generateAutomaticSettingsBundle as generateAutomaticSettingsBundleService } from "@/services/frontend/content-system";
import { saveGenerationSettings as saveGenerationSettingsService } from "@/services/frontend/user";
import { AgendaAutomationSection } from "./settings-sections/AgendaAutomationSection";
import { AgendaRulesSection } from "./settings-sections/AgendaRulesSection";
import { AutomationSection } from "./settings-sections/AutomationSection";
import { BriefingActionsBar } from "./settings-sections/BriefingActionsBar";
import { BriefingControlsSection } from "./settings-sections/BriefingControlsSection";
import { BriefingEditorSection } from "./settings-sections/BriefingEditorSection";
import { GeneratedAgendaSection } from "./settings-sections/GeneratedAgendaSection";
import { LanguageSection, PresetLibrarySection } from "./settings-sections/LanguageAndPresetSections";
import { MemorySection } from "./settings-sections/MemorySection";
import { NextPostCountdownCard } from "./settings-sections/NextPostCountdownCard";
import { SourcesSection } from "./settings-sections/SourcesSection";
import { StrategySection } from "./settings-sections/StrategySection";
import type { DayLabel, Props } from "./types";
import { DAY_ORDER, expandPreviewPostTimes } from "./utils";

const ENGLISH_DAY_TO_LABEL: Record<string, DayLabel> = {
  monday: "Segunda",
  tuesday: "Terca",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sabado",
  sunday: "Domingo"
};

function normalizeDayToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseDayLabelFromValue(value: string): DayLabel | null {
  const normalized = normalizeDayToken(value);
  const directMatch = DAY_ORDER.find((day) => normalizeDayToken(day) === normalized);
  if (directMatch) {
    return directMatch;
  }

  return ENGLISH_DAY_TO_LABEL[normalized] ?? null;
}

function parseDayLabelFromDate(date: string): DayLabel | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const parsedDate = new Date(`${date}T12:00:00-03:00`);
  if (!Number.isFinite(parsedDate.getTime())) {
    return null;
  }

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/Sao_Paulo"
  }).format(parsedDate);

  return ENGLISH_DAY_TO_LABEL[normalizeDayToken(weekday)] ?? null;
}

function resolveAgendaDayLabel(dayValue: string, dateValue: string): DayLabel | null {
  return parseDayLabelFromDate(dateValue) ?? parseDayLabelFromValue(dayValue);
}

export function ContentAutomationSettings({ initialProfile, initialAgenda, initialWeekPosts, initialAgendaSummary, initialTopicsHistory, initialTab = "agenda", initialOutputLanguage = "en", initialCustomInstructions = DEFAULT_CUSTOM_INSTRUCTIONS }: Props) {
  const { dictionary } = useI18n();
  const parsedInitialInstructions = useMemo(() => parseStoredCustomInstructions(initialCustomInstructions), [initialCustomInstructions]);
  const [outputLanguage, setOutputLanguage] = useState(initialOutputLanguage);
  const [briefingMode, setBriefingMode] = useState(parsedInitialInstructions.mode);
  const [guidedBriefingFields, setGuidedBriefingFields] = useState(parsedInitialInstructions.fields);
  const [customInstructions, setCustomInstructions] = useState(parsedInitialInstructions.prompt || DEFAULT_CUSTOM_INSTRUCTIONS);
  const [generationSettingsMessage, setGenerationSettingsMessage] = useState<string | null>(null);
  const [autoSettingKey, setAutoSettingKey] = useState<string | null>(null);
  const [isSavingGenerationSettings, startSavingGenerationSettings] = useTransition();
  const [isAutoGeneratingAllSettings, startAutoGeneratingAllSettings] = useTransition();
  const [expandedDays, setExpandedDays] = useState<Record<DayLabel, boolean>>(Object.fromEntries(DAY_ORDER.map((day, index) => [day, index === 0])) as Record<DayLabel, boolean>);
  const [openPresetPicker, setOpenPresetPicker] = useState<string | null>(null);
  const [activeQueueFilter, setActiveQueueFilter] = useState<"queued" | "generating" | "scheduled" | null>(null);
  const automation = useContentAutomation({ initialProfile, initialAgenda, initialWeekPosts, initialAgendaSummary, initialTopicsHistory, dictionary: { saveSuccess: dictionary.contentAutomation.saveSuccess, saveError: dictionary.contentAutomation.saveError, generateSuccess: dictionary.contentAutomation.generateSuccess, generateError: dictionary.contentAutomation.generateError, clearAgendaSuccess: dictionary.contentAutomation.clearAgendaSuccess, clearAgendaError: dictionary.contentAutomation.clearAgendaError, clearQueuedSuccess: dictionary.contentAutomation.clearQueuedSuccess, clearGeneratingSuccess: dictionary.contentAutomation.clearGeneratingSuccess, clearScheduledSuccess: dictionary.contentAutomation.clearScheduledSuccess, clearQueueError: dictionary.contentAutomation.clearQueueError, clearTopicsHistorySuccess: dictionary.contentAutomation.clearTopicsHistorySuccess, clearTopicsHistoryError: dictionary.contentAutomation.clearTopicsHistoryError } });

  const getConfirmedDaySlotData = (day: DayLabel) => {
    const dayConfig = automation.daySettings[day];
    const expandedTimes = expandPreviewPostTimes(
      parseTextareaItems(dayConfig.postTimes),
      Math.max(1, Number.parseInt(dayConfig.postsPerDay, 10) || 1)
    );
    const confirmedEntries = dayConfig.postIdeas
      .map((idea, index) => ({ idea, index }))
      .filter((entry) => entry.idea.confirmed);

    return {
      count: confirmedEntries.length,
      times: confirmedEntries.map((entry) => expandedTimes[entry.index] ?? "--:--"),
      ideas: confirmedEntries.map((entry) => ({
        goal: entry.idea.goal,
        contentTypes: entry.idea.contentTypes,
        formats: entry.idea.formats
      }))
    };
  };

  const groupedAgenda = useMemo(() => {
    const groups = automation.agenda.reduce((map, item) => {
      const resolvedDay = resolveAgendaDayLabel(item.day, item.date);
      const key = item.date;
      const current = map.get(key);
      const dayConfig = resolvedDay ? automation.daySettings[resolvedDay] : undefined;
      const confirmedSlotData = resolvedDay ? getConfirmedDaySlotData(resolvedDay) : {
        count: 0,
        times: [],
        ideas: []
      };

      const expectedPostsCount = confirmedSlotData.count;
      const expectedTimes = confirmedSlotData.times;
      const expectedIdeas = confirmedSlotData.ideas;
      if (current) {
        current.items.push(item);
      } else {
        map.set(key, {
          ...item,
          day: resolvedDay ?? item.day,
          expectedPostsCount,
          expectedTimes,
          expectedIdeas,
          items: [item],
          extraPosts: []
        });
      }
      return map;
    }, new Map<string, any>());

    const linkedPostIds = new Set(automation.agenda.map((item) => item.linkedPostId).filter(Boolean));

    for (const post of automation.weekPosts) {
      if (linkedPostIds.has(post.id)) {
        continue;
      }

      const groupEntry = Array.from(groups.values()).find((group) => group.date === post.localDate);
      if (!groupEntry) {
        continue;
      }

      groupEntry.extraPosts.push(post);
    }

    return Array.from(groups.values());
  }, [automation.agenda, automation.daySettings, automation.weekPosts]);
  const totalExpectedPosts = useMemo(
    () =>
      DAY_ORDER.reduce((total, day) => {
        if (!automation.daySettings[day].enabled) {
          return total;
        }

        return total + automation.daySettings[day].postIdeas.filter((idea) => idea.confirmed).length;
      }, 0),
    [automation.daySettings]
  );
  const goalPresetItems = useMemo(() => parseTextareaItems(automation.presets.goalPresets), [automation.presets.goalPresets]);
  const contentTypePresetItems = useMemo(() => parseTextareaItems(automation.presets.contentTypePresets), [automation.presets.contentTypePresets]);
  const formatPresetItems = useMemo(() => parseTextareaItems(automation.presets.formatPresets), [automation.presets.formatPresets]);
  const postTimesByDay = useMemo(() => Object.fromEntries(DAY_ORDER.map((day) => [day, parseTextareaItems(automation.daySettings[day].postTimes)])) as Record<DayLabel, string[]>, [automation.daySettings]);
  const slotRuntimeStatusByKey = useMemo(() => {
    const slotStatusMap: Record<string, "awaiting-confirmation" | "queued" | "generating-now" | "generated-and-scheduled" | "published" | "failed"> = {};
    const pendingConfirmedKeys: string[] = [];

    for (const day of DAY_ORDER) {
      const expandedTimes = expandPreviewPostTimes(
        parseTextareaItems(automation.daySettings[day].postTimes),
        Math.max(1, Number.parseInt(automation.daySettings[day].postsPerDay, 10) || 1)
      );
      const group = groupedAgenda.find((entry) => entry.day === day);

      automation.daySettings[day].postIdeas.forEach((idea, index) => {
        const key = `${day}-${index}`;
        const expectedTime = expandedTimes[index] ?? "";

        if (!idea.confirmed) {
          slotStatusMap[key] = "awaiting-confirmation";
          return;
        }

        const plannedItem = group?.items.find((item: (typeof group.items)[number]) => item.time === expectedTime);
        const extraPost = group?.extraPosts.find((post: (typeof group.extraPosts)[number]) => post.localTime === expectedTime);
        const runtimeStatus = plannedItem?.postGenerationStatus ?? extraPost?.status ?? "not-generated";

        if (runtimeStatus === "scheduled" || runtimeStatus === "draft") {
          slotStatusMap[key] = "generated-and-scheduled";
          return;
        }

        if (runtimeStatus === "publishing") {
          slotStatusMap[key] = "generating-now";
          return;
        }

        if (runtimeStatus === "published") {
          slotStatusMap[key] = "published";
          return;
        }

        if (runtimeStatus === "failed") {
          slotStatusMap[key] = "failed";
          return;
        }

        pendingConfirmedKeys.push(key);
      });
    }

    pendingConfirmedKeys.forEach((key, index) => {
      slotStatusMap[key] =
        automation.isSaving && index === 0 ? "generating-now" : "queued";
    });

    return slotStatusMap;
  }, [automation.daySettings, automation.isSaving, groupedAgenda]);
  const queueSummary = useMemo(
    () =>
      Object.values(slotRuntimeStatusByKey).reduce(
        (totals, status) => {
          if (status === "queued") {
            totals.queued += 1;
          }

          if (status === "generating-now") {
            totals.generating += 1;
          }

          if (status === "generated-and-scheduled") {
            totals.scheduled += 1;
          }

          return totals;
        },
        {
          queued: 0,
          generating: 0,
          scheduled: 0
        }
      ),
    [slotRuntimeStatusByKey]
  );
  const queueDetails = useMemo(() => {
    const details = {
      queued: [] as Array<{ id: string; title: string; meta: string }>,
      generating: [] as Array<{ id: string; title: string; meta: string }>,
      scheduled: [] as Array<{ id: string; title: string; meta: string }>
    };

    for (const day of DAY_ORDER) {
      const expandedTimes = expandPreviewPostTimes(
        parseTextareaItems(automation.daySettings[day].postTimes),
        Math.max(1, Number.parseInt(automation.daySettings[day].postsPerDay, 10) || 1)
      );
      const group = groupedAgenda.find((entry) => entry.day === day);

      automation.daySettings[day].postIdeas.forEach((idea, index) => {
        if (!idea.confirmed) {
          return;
        }

        const expectedTime = expandedTimes[index] ?? "--:--";
        const slotLabel = `${day} · ${dictionary.contentAutomation.postLabel} ${index + 1} · ${expectedTime}`;
        const plannedItem = group?.items.find(
          (item: (typeof group.items)[number]) => item.time === expectedTime
        );
        const extraPost = group?.extraPosts.find(
          (post: (typeof group.extraPosts)[number]) => post.localTime === expectedTime
        );
        const runtimeStatus = plannedItem?.postGenerationStatus ?? extraPost?.status ?? "not-generated";

        if (runtimeStatus === "not-generated") {
          details.queued.push({
            id: `${day}-${index}-queued`,
            title: idea.goal?.trim() || dictionary.contentAutomation.nextPostCreationPending,
            meta: slotLabel
          });
          return;
        }

        if (runtimeStatus === "publishing") {
          details.generating.push({
            id: `${day}-${index}-generating`,
            title:
              plannedItem?.theme?.trim() ||
              extraPost?.topic?.trim() ||
              dictionary.contentAutomation.postLabel,
            meta: slotLabel
          });
          return;
        }

        if (runtimeStatus === "scheduled" || runtimeStatus === "draft") {
          details.scheduled.push({
            id: `${day}-${index}-scheduled`,
            title:
              plannedItem?.theme?.trim() ||
              extraPost?.topic?.trim() ||
              dictionary.contentAutomation.postLabel,
            meta: slotLabel
          });
        }
      });
    }

    return details;
  }, [automation.daySettings, dictionary.contentAutomation.nextPostCreationPending, dictionary.contentAutomation.postLabel, groupedAgenda]);
  const queueActionTargets = useMemo(() => {
    const queuedSlotKeys: string[] = [];
    const generatingSlotKeys: string[] = [];
    const generatingPostIds: string[] = [];
    const scheduledSlotKeys: string[] = [];
    const scheduledPostIds: string[] = [];

    for (const day of DAY_ORDER) {
      const expandedTimes = expandPreviewPostTimes(
        parseTextareaItems(automation.daySettings[day].postTimes),
        Math.max(1, Number.parseInt(automation.daySettings[day].postsPerDay, 10) || 1)
      );
      const group = groupedAgenda.find((entry) => entry.day === day);

      automation.daySettings[day].postIdeas.forEach((idea, index) => {
        if (!idea.confirmed) {
          return;
        }

        const slotKey = `${day}-${index}`;
        const expectedTime = expandedTimes[index] ?? "";
        const plannedItem = group?.items.find(
          (item: (typeof group.items)[number]) => item.time === expectedTime
        );
        const extraPost = group?.extraPosts.find(
          (post: (typeof group.extraPosts)[number]) => post.localTime === expectedTime
        );
        const runtimeStatus = plannedItem?.postGenerationStatus ?? extraPost?.status ?? "not-generated";
        const postId = plannedItem?.linkedPostId ?? extraPost?.id ?? null;

        if (runtimeStatus === "not-generated") {
          queuedSlotKeys.push(slotKey);
          return;
        }

        if (runtimeStatus === "publishing") {
          generatingSlotKeys.push(slotKey);
          if (postId) {
            generatingPostIds.push(postId);
          }
          return;
        }

        if (runtimeStatus === "scheduled" || runtimeStatus === "draft") {
          scheduledSlotKeys.push(slotKey);
          if (postId) {
            scheduledPostIds.push(postId);
          }
        }
      });
    }

    return {
      queuedSlotKeys,
      generatingSlotKeys,
      generatingPostIds: Array.from(new Set(generatingPostIds)),
      scheduledSlotKeys,
      scheduledPostIds: Array.from(new Set(scheduledPostIds))
    };
  }, [automation.daySettings, groupedAgenda]);
  const queuedSlotKeys = useMemo(
    () =>
      Object.entries(slotRuntimeStatusByKey)
        .filter(([, status]) => status === "queued")
        .map(([slotKey]) => slotKey),
    [slotRuntimeStatusByKey]
  );
  const guidedBriefingPrompt = useMemo(() => ["You are an expert Instagram content strategist and visual designer.", "Use the following brand briefing as the main operating context for every idea, caption, and visual direction you create.", "Keep the content specific, strategic, commercially useful, and aligned with the brand identity described below.", "", ...Object.entries(guidedBriefingFields).map(([key, value]) => `${key}: ${value || "Not provided."}`)].join("\n"), [guidedBriefingFields]);
  const effectiveCustomInstructions = briefingMode === "guided" ? guidedBriefingPrompt : customInstructions;
  const briefingFieldDefinitions = useMemo(() => [["businessSummary", dictionary.generator.briefingBusinessSummary], ["targetAudience", dictionary.generator.briefingTargetAudience], ["mainObjective", dictionary.generator.briefingMainObjective], ["productsOrServices", dictionary.generator.briefingProductsOrServices], ["brandVoice", dictionary.generator.briefingBrandVoice], ["differentiators", dictionary.generator.briefingDifferentiators], ["painPoints", dictionary.generator.briefingPainPoints], ["contentPillars", dictionary.generator.briefingContentPillars], ["ctaPreference", dictionary.generator.briefingCtaPreference], ["restrictions", dictionary.generator.briefingRestrictions]] as Array<any>, [dictionary]);

  const runAutomaticSetting = async (input: { key: string; target: any; currentValue: string; apply: (value: string) => void; }) => { setGenerationSettingsMessage(null); automation.setError(null); setAutoSettingKey(input.key); try { const json = await generateAutomaticSettingService({ profile: automation.builtProfile, target: input.target, currentValue: input.currentValue }); if (!json.value) throw new Error(dictionary.contentAutomation.generateError); input.apply(json.value); } catch (requestError) { automation.setError(getClientRequestErrorMessage(requestError, dictionary.contentAutomation.generateError, dictionary.common.serverConnectionError)); } finally { setAutoSettingKey((current) => current === input.key ? null : current); } };
  const renderAutoButton = (key: string, onClick: () => Promise<void> | void) => <button type="button" disabled={autoSettingKey === key} onClick={() => { void Promise.resolve(onClick()); }} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">{autoSettingKey === key ? dictionary.contentAutomation.autoGeneratingField : dictionary.contentAutomation.autoGenerateField}</button>;
  const renderPresetPicker = (input: { pickerKey: string; presetsList: string[]; value: string; onAuto: () => Promise<void> | void; onSelectPreset: (preset: string) => void; multiselect?: boolean; }) => <div className="mt-2"><button type="button" onClick={() => setOpenPresetPicker((current) => current === input.pickerKey ? null : input.pickerKey)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink" aria-label={dictionary.contentAutomation.chooseSavedPreset}>+</button>{openPresetPicker === input.pickerKey ? <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{dictionary.contentAutomation.chooseSavedPreset}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={automation.autoFillKey === input.pickerKey.split("-").slice(0, 2).join("-")} onClick={() => { void Promise.resolve(input.onAuto()).then(() => setOpenPresetPicker(null)); }} className="rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60">{automation.autoFillKey === input.pickerKey.split("-").slice(0, 2).join("-") ? dictionary.contentAutomation.autoGeneratingField : dictionary.contentAutomation.autoGenerateField}</button>{input.presetsList.map((preset) => <button key={`${input.pickerKey}-${preset}`} type="button" onClick={() => { input.onSelectPreset(preset); if (!input.multiselect) setOpenPresetPicker(null); }} className="rounded-full border px-3 py-1 text-xs font-semibold transition">{preset}</button>)}</div></div> : null}</div>;

  const saveGenerationSettings = () => startSavingGenerationSettings(async () => { setGenerationSettingsMessage(null); try { const json = await saveGenerationSettingsService({ outputLanguage, customInstructions: serializeStoredCustomInstructions({ mode: briefingMode, fields: guidedBriefingFields, prompt: effectiveCustomInstructions }) }); if (json.outputLanguage) setOutputLanguage(json.outputLanguage); if (typeof json.customInstructions === "string") { const parsed = parseStoredCustomInstructions(json.customInstructions); setBriefingMode(parsed.mode); setGuidedBriefingFields(parsed.fields); setCustomInstructions(parsed.prompt || DEFAULT_CUSTOM_INSTRUCTIONS); } setGenerationSettingsMessage(dictionary.generator.settingsSaved); } catch (requestError) { automation.setError(getClientRequestErrorMessage(requestError, dictionary.generator.settingsSaveError, dictionary.common.serverConnectionError)); } });
  const generateAutomaticSettingsBundle = () => startAutoGeneratingAllSettings(async () => { setGenerationSettingsMessage(null); automation.setError(null); try { const json = await generateAutomaticSettingsBundleService({ profile: automation.builtProfile, customInstructions: effectiveCustomInstructions }); automation.setBrandName(json.brandName ?? automation.brandName); automation.setEditableBrief(json.editableBrief ?? automation.editableBrief); automation.setServices(json.services ?? automation.services); automation.setContentRules(json.contentRules ?? automation.contentRules); automation.setResearchQueries(json.researchQueries ?? automation.researchQueries); automation.setCarouselDefaultStructure(json.carouselDefaultStructure ?? automation.carouselDefaultStructure); automation.updatePreset("goalPresets", json.goalPresets ?? automation.presets.goalPresets); automation.updatePreset("contentTypePresets", json.contentTypePresets ?? automation.presets.contentTypePresets); automation.updatePreset("formatPresets", json.formatPresets ?? automation.presets.formatPresets); if (typeof json.customInstructions === "string") { setBriefingMode("prompt"); setCustomInstructions(json.customInstructions || DEFAULT_CUSTOM_INSTRUCTIONS); } } catch (requestError) { automation.setError(getClientRequestErrorMessage(requestError, dictionary.contentAutomation.generateError, dictionary.common.serverConnectionError)); } });

  const settingsSectionProps = { dictionary, brandName: automation.brandName, setBrandName: automation.setBrandName, editableBrief: automation.editableBrief, setEditableBrief: automation.setEditableBrief, automationLoopEnabled: automation.automationLoopEnabled, setAutomationLoopEnabled: automation.setAutomationLoopEnabled, topicsHistoryCleanupFrequency: automation.topicsHistoryCleanupFrequency, setTopicsHistoryCleanupFrequency: automation.setTopicsHistoryCleanupFrequency, generationRigor: automation.generationRigor, setGenerationRigor: automation.setGenerationRigor, historyLookbackDays: automation.historyLookbackDays, setHistoryLookbackDays: automation.setHistoryLookbackDays, services: automation.services, setServices: automation.setServices, contentRules: automation.contentRules, setContentRules: automation.setContentRules, researchQueries: automation.researchQueries, setResearchQueries: automation.setResearchQueries, carouselDefaultStructure: automation.carouselDefaultStructure, setCarouselDefaultStructure: automation.setCarouselDefaultStructure, presets: automation.presets, updatePreset: automation.updatePreset, renderAutoButton, runAutomaticSetting, saveSettings: automation.saveSettings, generateWeeklyAgenda: automation.generateWeeklyAgenda, isSaving: automation.isSaving, isGenerating: automation.isGenerating, currentTopics: automation.currentTopics, uniqueTopicsHistory: automation.uniqueTopicsHistory, clearTopicsHistory: automation.clearTopicsHistory };
  const agendaSectionProps = { dictionary, daySettings: automation.daySettings, expandedDays, toggleExpandedDay: (day: DayLabel) => setExpandedDays((current) => ({ ...current, [day]: !current[day] })), toggleDay: automation.toggleDay, updateDay: automation.updateDay, updateDayPostTime: automation.updateDayPostTime, updateDayPostIdea: automation.updateDayPostIdea, toggleDayPostConfirmation: automation.toggleDayPostConfirmation, renderPresetPicker, goalPresetItems, contentTypePresetItems, formatPresetItems, autoFillKey: automation.autoFillKey, generateAutomaticPostIdea: automation.generateAutomaticPostIdea, autoFillNewDayPost: automation.autoFillNewDayPost, dismissAutoFillSuggestion: automation.dismissAutoFillSuggestion, suggestedAutoFillTargets: automation.suggestedAutoFillTargets, postTimesByDay, slotRuntimeStatusByKey, setAllDaysEnabled: automation.setAllDaysEnabled, saveSettings: automation.saveSettings, generateWeeklyAgenda: automation.generateWeeklyAgenda, isSaving: automation.isSaving, isGenerating: automation.isGenerating, currentTopics: automation.currentTopics, groupedAgenda, totalExpectedPosts, agendaSummary: automation.agendaSummary, keepUsingStaleAgenda: automation.keepUsingStaleAgenda, clearAgenda: automation.clearAgenda, isResolvingStaleAgenda: automation.isResolvingStaleAgenda, isClearingAgenda: automation.isClearingAgenda };

  return <div className="space-y-6">{renderStatusMessage(automation.message, automation.error)}{initialTab === "settings" ? <><BriefingControlsSection dictionary={dictionary} outputLanguage={outputLanguage} setOutputLanguage={setOutputLanguage} briefingMode={briefingMode} setBriefingMode={setBriefingMode} /><BriefingEditorSection dictionary={dictionary} briefingMode={briefingMode} briefingFieldDefinitions={briefingFieldDefinitions} guidedBriefingFields={guidedBriefingFields} updateGuidedBriefingField={(field, value) => setGuidedBriefingFields((current) => ({ ...current, [field]: value }))} guidedBriefingPrompt={guidedBriefingPrompt} customInstructions={customInstructions} setCustomInstructions={setCustomInstructions} renderAutoButton={renderAutoButton} generatePromptInstructions={() => runAutomaticSetting({ key: "customInstructions", target: "customInstructions", currentValue: customInstructions, apply: (value) => { setBriefingMode("prompt"); setCustomInstructions(value); } })} clearGuidedBriefing={() => setGuidedBriefingFields(createEmptyBriefingFields())} /><BriefingActionsBar dictionary={dictionary} generateAutomaticSettingsBundle={generateAutomaticSettingsBundle} isAutoGeneratingAllSettings={isAutoGeneratingAllSettings} saveGenerationSettings={saveGenerationSettings} isSavingGenerationSettings={isSavingGenerationSettings} generationSettingsMessage={generationSettingsMessage} /><StrategySection {...settingsSectionProps} /><div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><SourcesSection {...settingsSectionProps} /><AutomationSection {...settingsSectionProps} /></div><MemorySection {...settingsSectionProps} /><LanguageSection dictionary={dictionary} /><PresetLibrarySection {...settingsSectionProps} /></> : null}{initialTab === "agenda" ? <><div className="flex justify-end"><button type="button" onClick={() => { if (!window.confirm(dictionary.contentAutomation.clearAgendaConfirm)) { return; } automation.clearAgenda(); }} disabled={automation.isClearingAgenda || automation.isResolvingStaleAgenda || automation.isSaving || automation.isGenerating} className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60">{automation.isClearingAgenda ? dictionary.contentAutomation.clearingAgenda : dictionary.contentAutomation.clearAgenda}</button></div><NextPostCountdownCard dictionary={dictionary} groupedAgenda={groupedAgenda} weekPosts={automation.weekPosts} queueSummary={queueSummary} queueDetails={queueDetails} activeQueueFilter={activeQueueFilter} onQueueFilterChange={setActiveQueueFilter} onClearQueued={() => { if (queueActionTargets.queuedSlotKeys.length === 0) { return; } if (!window.confirm(dictionary.contentAutomation.clearQueuedConfirm)) { return; } automation.clearQueueByStatus({ status: "queued", slotKeys: queueActionTargets.queuedSlotKeys }); setActiveQueueFilter(null); }} onClearGenerating={() => { if (queueActionTargets.generatingSlotKeys.length === 0) { return; } if (!window.confirm(dictionary.contentAutomation.clearGeneratingConfirm)) { return; } automation.clearQueueByStatus({ status: "generating", slotKeys: queueActionTargets.generatingSlotKeys, postIds: queueActionTargets.generatingPostIds }); setActiveQueueFilter(null); }} onClearScheduled={() => { if (queueActionTargets.scheduledSlotKeys.length === 0) { return; } if (!window.confirm(dictionary.contentAutomation.clearScheduledConfirm)) { return; } automation.clearQueueByStatus({ status: "scheduled", slotKeys: queueActionTargets.scheduledSlotKeys, postIds: queueActionTargets.scheduledPostIds }); setActiveQueueFilter(null); }} isClearingQueue={automation.isClearingQueue} clearingQueueStatus={automation.clearingQueueStatus} /><AgendaAutomationSection {...agendaSectionProps} /><AgendaRulesSection {...agendaSectionProps} /><GeneratedAgendaSection dictionary={dictionary} groupedAgenda={groupedAgenda} totalExpectedPosts={totalExpectedPosts} agendaSummary={automation.agendaSummary} keepUsingStaleAgenda={automation.keepUsingStaleAgenda} isResolvingStaleAgenda={automation.isResolvingStaleAgenda} activeQueueFilter={activeQueueFilter} slotRuntimeStatusByKey={slotRuntimeStatusByKey} /></> : null}</div>;
}
