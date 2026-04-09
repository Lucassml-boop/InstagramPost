"use client";

import { useMemo, useState, useTransition } from "react";
import {
  clearTopicsHistory as clearTopicsHistoryService,
  fetchTopicsHistory as fetchTopicsHistoryService,
  generateWeeklyAgenda as generateWeeklyAgendaService,
  saveBrandProfile as saveBrandProfileService
} from "@/services/frontend/content-system";
import type { DayLabel, Props } from "@/components/content-automation/types";
import {
  buildDayState,
  buildProfileFromState,
  toTextareaValue
} from "@/components/content-automation/utils";

export function useContentAutomation(input: {
  initialProfile: Props["initialProfile"];
  initialAgenda: Props["initialAgenda"];
  initialTopicsHistory: Props["initialTopicsHistory"];
  dictionary: {
    saveSuccess: string;
    saveError: string;
    generateSuccess: string;
    generateError: string;
    clearTopicsHistorySuccess: string;
    clearTopicsHistoryError: string;
  };
}) {
  const [brandName, setBrandName] = useState(input.initialProfile.brandName);
  const [editableBrief, setEditableBrief] = useState(input.initialProfile.editableBrief);
  const [automationLoopEnabled, setAutomationLoopEnabled] = useState(
    input.initialProfile.automationLoopEnabled
  );
  const [topicsHistoryCleanupFrequency, setTopicsHistoryCleanupFrequency] = useState<
    "disabled" | "daily" | "weekly" | "monthly"
  >(input.initialProfile.topicsHistoryCleanupFrequency);
  const [services, setServices] = useState(toTextareaValue(input.initialProfile.services));
  const [carouselDefaultStructure, setCarouselDefaultStructure] = useState(
    toTextareaValue(input.initialProfile.carouselDefaultStructure)
  );
  const [contentRules, setContentRules] = useState(
    toTextareaValue(input.initialProfile.contentRules)
  );
  const [researchQueries, setResearchQueries] = useState(
    toTextareaValue(input.initialProfile.researchQueries)
  );
  const [daySettings, setDaySettings] = useState(buildDayState(input.initialProfile));
  const [agenda, setAgenda] = useState(input.initialAgenda);
  const [topicsHistory, setTopicsHistory] = useState(input.initialTopicsHistory);
  const [currentTopics, setCurrentTopics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();

  const builtProfile = useMemo(
    () =>
      buildProfileFromState({
        brandName,
        editableBrief,
        automationLoopEnabled,
        topicsHistoryCleanupFrequency,
        services,
        carouselDefaultStructure,
        contentRules,
        researchQueries,
        daySettings
      }),
    [
      brandName,
      editableBrief,
      automationLoopEnabled,
      topicsHistoryCleanupFrequency,
      services,
      carouselDefaultStructure,
      contentRules,
      researchQueries,
      daySettings
    ]
  );

  const uniqueTopicsHistory = useMemo(
    () => Array.from(new Set(topicsHistory.map((topic) => topic.trim()).filter(Boolean))),
    [topicsHistory]
  );

  function updateDay(day: DayLabel, field: "goal" | "contentTypes" | "formats", value: string) {
    setDaySettings((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value
      }
    }));
  }

  function saveSettings() {
    setMessage(null);
    setError(null);

    startSaving(async () => {
      try {
        await saveBrandProfileService(builtProfile);
        setMessage(input.dictionary.saveSuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : input.dictionary.saveError
        );
      }
    });
  }

  function generateWeeklyAgenda() {
    setMessage(null);
    setError(null);

    startGenerating(async () => {
      try {
        await saveBrandProfileService(builtProfile);
        const json = await generateWeeklyAgendaService();

        setAgenda(json.agenda ?? []);
        setCurrentTopics(json.currentTopics ?? []);
        const topicsHistoryJson = await fetchTopicsHistoryService();
        setTopicsHistory(topicsHistoryJson.topicsHistory ?? []);
        setMessage(input.dictionary.generateSuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : input.dictionary.generateError
        );
      }
    });
  }

  function clearTopicsHistory() {
    setMessage(null);
    setError(null);

    startSaving(async () => {
      try {
        const json = await clearTopicsHistoryService();
        setTopicsHistory(json.topicsHistory ?? []);
        setMessage(input.dictionary.clearTopicsHistorySuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : input.dictionary.clearTopicsHistoryError
        );
      }
    });
  }

  return {
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
    daySettings,
    agenda,
    topicsHistory,
    currentTopics,
    message,
    error,
    isSaving,
    isGenerating,
    uniqueTopicsHistory,
    updateDay,
    saveSettings,
    generateWeeklyAgenda,
    clearTopicsHistory
  };
}
