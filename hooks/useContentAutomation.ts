"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { AgendaGenerationStatus } from "@/components/content-automation/settings-sections/types";
import {
  cancelGenerationProgress as cancelGenerationProgressService,
  clearAgenda as clearAgendaService,
  clearTopicsHistory as clearTopicsHistoryService,
  fetchGenerationProgress as fetchGenerationProgressService,
  fetchTopicsHistory as fetchTopicsHistoryService,
  generateAutomaticPostIdea as generateAutomaticPostIdeaService,
  generateWeeklyAgenda as generateWeeklyAgendaService,
  keepUsingStaleAgenda as keepUsingStaleAgendaService,
  saveBrandProfileWithAgenda as saveBrandProfileService
} from "@/services/frontend/content-system";
import { deletePosts } from "@/services/frontend/posts";
import type { DayLabel, Props } from "@/components/content-automation/types";
import {
  buildDayState,
  buildPresetsState,
  buildProfileFromState,
  expandPreviewPostTimes,
  fromTextareaValue,
  toTextareaValue
} from "@/components/content-automation/utils";

export function useContentAutomation(input: {
  initialProfile: Props["initialProfile"];
  initialAgenda: Props["initialAgenda"];
  initialWeekPosts: Props["initialWeekPosts"];
  initialAgendaSummary: Props["initialAgendaSummary"];
  initialTopicsHistory: Props["initialTopicsHistory"];
  dictionary: {
    saveSuccess: string;
    saveError: string;
    generateSuccess: string;
    generateError: string;
    clearAgendaSuccess: string;
    clearAgendaError: string;
    clearQueuedSuccess: string;
    clearGeneratingSuccess: string;
    clearScheduledSuccess: string;
    clearQueueError: string;
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
  const [generationRigor, setGenerationRigor] = useState<"strict" | "balanced" | "flexible">(
    input.initialProfile.generationRigor
  );
  const [historyLookbackDays, setHistoryLookbackDays] = useState(
    input.initialProfile.historyLookbackDays
  );
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
  const [presets, setPresets] = useState(buildPresetsState(input.initialProfile));
  const [daySettings, setDaySettings] = useState(buildDayState(input.initialProfile));
  const [agenda, setAgenda] = useState(input.initialAgenda);
  const [weekPosts, setWeekPosts] = useState(input.initialWeekPosts);
  const [agendaSummary, setAgendaSummary] = useState(input.initialAgendaSummary);
  const [topicsHistory, setTopicsHistory] = useState(input.initialTopicsHistory);
  const [currentTopics, setCurrentTopics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();
  const [autoFillKey, setAutoFillKey] = useState<string | null>(null);
  const [suggestedAutoFillTargets, setSuggestedAutoFillTargets] = useState<
    Record<DayLabel, number[]>
  >({
    Segunda: [],
    Terca: [],
    Quarta: [],
    Quinta: [],
    Sexta: [],
    Sabado: [],
    Domingo: []
  });
  const [isResolvingStaleAgenda, startResolvingStaleAgenda] = useTransition();
  const [isClearingAgenda, startClearingAgenda] = useTransition();
  const [isClearingQueue, startClearingQueue] = useTransition();
  const [clearingQueueStatus, setClearingQueueStatus] = useState<
    "queued" | "generating" | "scheduled" | null
  >(null);
  const [generationStatus, setGenerationStatus] = useState<AgendaGenerationStatus>({
    state: "idle",
    phase: null,
    startedAt: null,
    phaseStartedAt: null,
    completedAt: null,
    detailMessage: null,
    preparedCount: null,
    scannedCount: null,
    activeTheme: null,
    currentPostIndex: null,
    totalPosts: null,
    errorMessage: null
  });

  useEffect(() => {
    if (generationStatus.state !== "running") {
      return;
    }

    let cancelled = false;
    const updateFromBackend = async () => {
      try {
        const json = await fetchGenerationProgressService();
        const progress = json.progress;
        if (!progress || cancelled) {
          return;
        }
        if (progress.state === "idle") {
          return;
        }

        const nextPhase =
          progress.stage === "saving-settings"
            ? "saving-settings"
            : progress.stage === "generating-weekly-plan"
              ? "generating-plan"
              : progress.stage === "materializing-posts" ||
                  progress.stage === "summarizing-response"
                ? "refreshing-data"
                : progress.state === "failed" || progress.state === "completed"
                  ? null
                  : null;

        setGenerationStatus((current) => ({
          ...current,
          state: progress.state,
          phase: nextPhase,
          startedAt: progress.startedAt ?? current.startedAt,
          phaseStartedAt:
            current.phase !== nextPhase || current.phaseStartedAt === null
              ? Date.now()
              : current.phaseStartedAt,
          completedAt: progress.completedAt ?? current.completedAt,
          detailMessage: progress.message,
          preparedCount: progress.prepared,
          scannedCount: progress.scanned,
          activeTheme: progress.activeTheme,
          currentPostIndex: progress.currentPostIndex,
          totalPosts: progress.totalPosts,
          errorMessage: progress.errorMessage
        }));
      } catch {
        return;
      }
    };

    void updateFromBackend();
    const interval = window.setInterval(() => {
      void updateFromBackend();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [generationStatus.state]);

  const builtProfile = useMemo(
    () =>
      buildProfileFromState({
        brandName,
        editableBrief,
        automationLoopEnabled,
        topicsHistoryCleanupFrequency,
        generationRigor,
        historyLookbackDays,
        services,
        carouselDefaultStructure,
        contentRules,
        researchQueries,
        daySettings,
        presets
      }),
    [
      brandName,
      editableBrief,
      automationLoopEnabled,
      topicsHistoryCleanupFrequency,
      generationRigor,
      historyLookbackDays,
      services,
      carouselDefaultStructure,
      contentRules,
      researchQueries,
      daySettings,
      presets
    ]
  );

  const uniqueTopicsHistory = useMemo(
    () => Array.from(new Set(topicsHistory.map((topic) => topic.trim()).filter(Boolean))),
    [topicsHistory]
  );
  const isGeneratingEffectively = isGenerating || generationStatus.state === "running";

  function updateDay(day: DayLabel, field: "postsPerDay" | "postTimes", value: string) {
    setDaySettings((current) => {
      const previousPostsPerDay = Math.max(1, Number.parseInt(current[day].postsPerDay, 10) || 1);
      const nextValue =
        field === "postsPerDay" ? Math.max(1, Number.parseInt(value, 10) || 1).toString() : value;
      const nextPostsPerDay =
        field === "postsPerDay"
          ? Math.max(1, Number.parseInt(value, 10) || 1)
          : Math.max(1, Number.parseInt(current[day].postsPerDay, 10) || 1);
      const existingIdeas = current[day].postIdeas;
      const nextIdeas = Array.from({ length: nextPostsPerDay }, (_, index) => ({
        goal: existingIdeas[index]?.goal ?? "",
        contentTypes: existingIdeas[index]?.contentTypes ?? "",
        formats: existingIdeas[index]?.formats ?? "",
        brandColors: existingIdeas[index]?.brandColors ?? "",
        confirmed: existingIdeas[index]?.confirmed ?? index === 0
      }));

      return {
        ...current,
        [day]: {
          ...current[day],
          [field]: nextValue,
          postIdeas: nextIdeas
        }
      };
    });

    if (field === "postsPerDay") {
      const nextPostsPerDay = Math.max(1, Number.parseInt(value, 10) || 1);
      const previousPostsPerDay = Math.max(1, Number.parseInt(daySettings[day].postsPerDay, 10) || 1);

      setSuggestedAutoFillTargets((current) => {
        const existing = current[day] ?? [];

        if (nextPostsPerDay <= previousPostsPerDay) {
          return {
            ...current,
            [day]: existing.filter((index) => index < nextPostsPerDay)
          };
        }

        const addedIndexes = Array.from(
          { length: nextPostsPerDay - previousPostsPerDay },
          (_, index) => previousPostsPerDay + index
        );

        return {
          ...current,
          [day]: Array.from(new Set([...existing, ...addedIndexes]))
        };
      });
    }
  }

  function updateDayPostIdea(
    day: DayLabel,
    postIndex: number,
    field: "goal" | "contentTypes" | "formats" | "brandColors",
    value: string
  ) {
    setSuggestedAutoFillTargets((current) => ({
      ...current,
      [day]: (current[day] ?? []).filter((index) => index !== postIndex)
    }));

    setDaySettings((current) => ({
      ...current,
      [day]: {
        ...current[day],
        postIdeas: current[day].postIdeas.map((idea, index) =>
          index === postIndex
            ? {
                ...idea,
                [field]: value
              }
            : idea
        )
      }
    }));
  }

  function updateDayPostTime(day: DayLabel, postIndex: number, value: string) {
    setSuggestedAutoFillTargets((current) => ({
      ...current,
      [day]: (current[day] ?? []).filter((index) => index !== postIndex)
    }));

    setDaySettings((current) => {
      const nextTimes = fromTextareaValue(current[day].postTimes);
      const normalizedTimes = Array.from(
        { length: Math.max(nextTimes.length, current[day].postIdeas.length, postIndex + 1) },
        (_, index) => nextTimes[index] ?? ""
      );

      normalizedTimes[postIndex] = value.trim();

      return {
        ...current,
        [day]: {
          ...current[day],
          postTimes: normalizedTimes.join("\n")
        }
      };
    });
  }

  function toggleDayPostConfirmation(day: DayLabel, postIndex: number, confirmed: boolean) {
    setSuggestedAutoFillTargets((current) => ({
      ...current,
      [day]: confirmed ? (current[day] ?? []) : (current[day] ?? []).filter((index) => index !== postIndex)
    }));

    setDaySettings((current) => ({
      ...current,
      [day]: {
        ...current[day],
        postIdeas: current[day].postIdeas.map((idea, index) =>
          index === postIndex
            ? {
                ...idea,
                confirmed
              }
            : idea
        )
      }
    }));
  }

  function updatePreset(
    field: keyof typeof presets,
    value: string
  ) {
    setPresets((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function generateAutomaticPostIdea(day: DayLabel, postIndex: number) {
    setMessage(null);
    setError(null);
    const requestKey = `${day}-${postIndex}`;
    setAutoFillKey(requestKey);

    try {
      const json = await generateAutomaticPostIdeaService({
        profile: builtProfile,
        day,
        postIndex
      });

      if (!json.idea) {
        throw new Error(input.dictionary.generateError);
      }

      setDaySettings((current) => ({
        ...current,
        [day]: {
          ...current[day],
          postIdeas: current[day].postIdeas.map((idea, index) =>
            index === postIndex
              ? {
                  ...idea,
                  goal: json.idea?.goal ?? "",
                  contentTypes: (json.idea?.contentTypes ?? []).join("\n"),
                  formats: (json.idea?.formats ?? []).join("\n"),
                  confirmed: idea.confirmed
                }
              : idea
          )
        }
      }));
      setSuggestedAutoFillTargets((current) => ({
        ...current,
        [day]: (current[day] ?? []).filter((index) => index !== postIndex)
      }));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : input.dictionary.generateError
      );
    } finally {
      setAutoFillKey((current) => (current === requestKey ? null : current));
    }
  }

  async function autoFillNewDayPost(day: DayLabel, postIndex: number) {
    const expandedTimes = expandPreviewPostTimes(
      fromTextareaValue(daySettings[day].postTimes),
      Math.max(1, Number.parseInt(daySettings[day].postsPerDay, 10) || 1)
    );
    const suggestedTime = expandedTimes[postIndex] ?? "";
    const currentTime = fromTextareaValue(daySettings[day].postTimes)[postIndex] ?? "";

    if (!currentTime && suggestedTime) {
      updateDayPostTime(day, postIndex, suggestedTime);
    }

    await generateAutomaticPostIdea(day, postIndex);
  }

  function dismissAutoFillSuggestion(day: DayLabel, postIndex: number) {
    setSuggestedAutoFillTargets((current) => ({
      ...current,
      [day]: (current[day] ?? []).filter((index) => index !== postIndex)
    }));
  }

  function toggleDay(day: DayLabel, enabled: boolean) {
    setDaySettings((current) => ({
      ...current,
      [day]: {
        ...current[day],
        enabled
      }
    }));
  }

  function setAllDaysEnabled(enabled: boolean) {
    setDaySettings((current) =>
      Object.fromEntries(
        Object.entries(current).map(([day, config]) => {
          if (!enabled) {
            // Desabilitar: apenas mudar enabled para false
            return [day, { ...config, enabled: false }];
          }
          // Habilitar: mudar enabled para true E confirmar pelo menos o primeiro slot
          const updatedPostIdeas = config.postIdeas.map((idea, index) => ({
            ...idea,
            confirmed: index === 0 ? true : idea.confirmed // Confirma o primeiro slot
          }));
          return [day, { ...config, enabled: true, postIdeas: updatedPostIdeas }];
        })
      ) as typeof current
    );
  }

  function saveSettings() {
    setMessage(null);
    setError(null);

    startSaving(async () => {
      try {
        const json = await saveBrandProfileService(builtProfile);
        setAgenda(json.agenda ?? []);
        setWeekPosts(json.weekPosts ?? []);
        if (json.agendaSummary) {
          setAgendaSummary(json.agendaSummary);
        }
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
    const startedAt = Date.now();
    setGenerationStatus({
      state: "running",
      phase: "saving-settings",
      startedAt,
      phaseStartedAt: startedAt,
      completedAt: null,
      detailMessage: "Salvando a configuracao atual antes de iniciar a geracao.",
      preparedCount: 0,
      scannedCount: 0,
      activeTheme: null,
      currentPostIndex: null,
      totalPosts: null,
      errorMessage: null
    });

    startGenerating(async () => {
      try {
        const saved = await saveBrandProfileService(builtProfile);
        setAgenda(saved.agenda ?? []);
        setWeekPosts(saved.weekPosts ?? []);
        if (saved.agendaSummary) {
          setAgendaSummary(saved.agendaSummary);
        }
        setGenerationStatus((current) => ({
          ...current,
          state: "running",
          phase: "generating-plan",
          phaseStartedAt: Date.now(),
          detailMessage: "Gerando a agenda inicial dos proximos 7 dias."
        }));
        const json = await generateWeeklyAgendaService();

        setAgenda(json.agenda ?? []);
        setWeekPosts(json.weekPosts ?? []);
        if (json.agendaSummary) {
          setAgendaSummary(json.agendaSummary);
        }
        setCurrentTopics(json.currentTopics ?? []);
        setGenerationStatus((current) => ({
          ...current,
          state: "running",
          phase: "refreshing-data",
          phaseStartedAt: Date.now(),
          detailMessage: "Atualizando a tela com a agenda e o historico mais recente."
        }));
        const topicsHistoryJson = await fetchTopicsHistoryService();
        setTopicsHistory(topicsHistoryJson.topicsHistory ?? []);
        setMessage(input.dictionary.generateSuccess);
        setGenerationStatus((current) => ({
          ...current,
          state: "completed",
          phase: null,
          completedAt: Date.now(),
          detailMessage: current.detailMessage,
          errorMessage: null
        }));
      } catch (requestError) {
        const nextError =
          requestError instanceof Error ? requestError.message : input.dictionary.generateError;
        setError(nextError);
        setGenerationStatus((current) => ({
          ...current,
          state: "failed",
          completedAt: Date.now(),
          detailMessage: current.detailMessage,
          errorMessage: nextError
        }));
      }
    });
  }

  function cancelWeeklyGeneration() {
    if (generationStatus.state !== "running") {
      return;
    }

    void cancelGenerationProgressService()
      .then(() => {
        setGenerationStatus((current) => ({
          ...current,
          detailMessage: "Cancelamento solicitado. Encerrando a geracao no proximo ponto seguro."
        }));
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error ? requestError.message : input.dictionary.generateError
        );
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

  function keepUsingStaleAgenda() {
    setMessage(null);
    setError(null);

    startResolvingStaleAgenda(async () => {
      try {
        const json = await keepUsingStaleAgendaService();
        if (json.agendaSummary) {
          setAgendaSummary(json.agendaSummary);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : input.dictionary.generateError
        );
      }
    });
  }

  function clearAgenda() {
    setMessage(null);
    setError(null);

    startClearingAgenda(async () => {
      try {
        const json = await clearAgendaService();
        setAgenda(json.agenda ?? []);
        setWeekPosts(json.weekPosts ?? []);
        if (json.profile) {
          setDaySettings(buildDayState(json.profile));
        }
        if (json.agendaSummary) {
          setAgendaSummary(json.agendaSummary);
        }
        setMessage(input.dictionary.clearAgendaSuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : input.dictionary.clearAgendaError
        );
      }
    });
  }

  function clearQueueByStatus(inputValue: {
    status: "queued" | "generating" | "scheduled";
    slotKeys: string[];
    postIds?: string[];
  }) {
    const { status, slotKeys, postIds = [] } = inputValue;
    if (slotKeys.length === 0) {
      if (status === "queued") {
        setMessage(input.dictionary.clearQueuedSuccess);
        return;
      }

      if (status === "generating") {
        setMessage(input.dictionary.clearGeneratingSuccess);
        return;
      }

      setMessage(input.dictionary.clearScheduledSuccess);
      return;
    }

    setMessage(null);
    setError(null);
    setClearingQueueStatus(status);

    startClearingQueue(async () => {
      try {
        const uniquePostIds = Array.from(new Set(postIds.filter(Boolean)));
        if (uniquePostIds.length > 0) {
          await deletePosts(uniquePostIds);
        }

        const queuedKeySet = new Set(slotKeys);
        const nextDaySettings = (Object.keys(daySettings) as DayLabel[]).reduce(
          (acc, day) => {
            acc[day] = {
              ...daySettings[day],
              postIdeas: daySettings[day].postIdeas.map((idea, index) => {
                const slotKey = `${day}-${index}`;
                if (!queuedKeySet.has(slotKey)) {
                  return idea;
                }

                return {
                  ...idea,
                  confirmed: false
                };
              })
            };

            return acc;
          },
          {} as typeof daySettings
        );

        const nextProfile = buildProfileFromState({
          brandName,
          editableBrief,
          automationLoopEnabled,
          topicsHistoryCleanupFrequency,
          generationRigor,
          historyLookbackDays,
          services,
          carouselDefaultStructure,
          contentRules,
          researchQueries,
          daySettings: nextDaySettings,
          presets
        });

        const json = await saveBrandProfileService(nextProfile);

        if (json.profile) {
          setDaySettings(buildDayState(json.profile));
        } else {
          setDaySettings(nextDaySettings);
        }

        setAgenda(json.agenda ?? []);
        setWeekPosts(json.weekPosts ?? []);
        if (json.agendaSummary) {
          setAgendaSummary(json.agendaSummary);
        }

        if (status === "queued") {
          setMessage(input.dictionary.clearQueuedSuccess);
        } else if (status === "generating") {
          setMessage(input.dictionary.clearGeneratingSuccess);
        } else {
          setMessage(input.dictionary.clearScheduledSuccess);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : input.dictionary.clearQueueError
        );
      } finally {
        setClearingQueueStatus(null);
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
    generationRigor,
    setGenerationRigor,
    historyLookbackDays,
    setHistoryLookbackDays,
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
    weekPosts,
    agendaSummary,
    topicsHistory,
    currentTopics,
    message,
    error,
    setError,
    isSaving,
    isGenerating: isGeneratingEffectively,
    autoFillKey,
    suggestedAutoFillTargets,
    isResolvingStaleAgenda,
    isClearingAgenda,
    isClearingQueue,
    clearingQueueStatus,
    generationStatus,
    uniqueTopicsHistory,
    updateDay,
    updateDayPostIdea,
    updateDayPostTime,
    toggleDayPostConfirmation,
    generateAutomaticPostIdea,
    autoFillNewDayPost,
    dismissAutoFillSuggestion,
    toggleDay,
    setAllDaysEnabled,
    saveSettings,
    generateWeeklyAgenda,
    cancelWeeklyGeneration,
    clearAgenda,
    clearQueueByStatus,
    keepUsingStaleAgenda,
    clearTopicsHistory
  };
}
