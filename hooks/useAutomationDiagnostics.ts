"use client";

import { useMemo, useState, useTransition } from "react";
import { fetchAgenda, runAutomationAction } from "@/services/frontend/content-system";
import type { ContentPlanItem } from "@/lib/content-system";

type AutomationAction = {
  id:
    | "generate-weekly"
    | "clear-topics-history"
    | "publish-scheduled"
    | "publish-weekly-preview"
    | "refresh-instagram";
  title: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
};

type ActionState = {
  loading: boolean;
  status: number | null;
  result: string | null;
  parsed: unknown | null;
  error: string | null;
};

export function useAutomationDiagnostics(input: {
  dictionary: {
    generateWeeklyTitle: string;
    generateWeeklyDescription: string;
    clearTopicsTitle: string;
    clearTopicsDescription: string;
    publishScheduledTitle: string;
    publishScheduledDescription: string;
    publishWeeklyPreviewTitle: string;
    publishWeeklyPreviewDescription: string;
    refreshTokensTitle: string;
    refreshTokensDescription: string;
    summaryLabel: string;
    weeklySkipped: string;
    itemsGenerated: string;
    cleanupSkipped: string;
    itemsCleared: string;
    itemsProcessed: string;
    itemsPublished: string;
    itemsFailed: string;
    tokensRefreshed: string;
    requestFailed: string;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const [agendaOptions, setAgendaOptions] = useState<ContentPlanItem[]>([]);
  const [selectedWeeklyDate, setSelectedWeeklyDate] = useState<string>("all");

  const actions: AutomationAction[] = useMemo(
    () => [
      {
        id: "generate-weekly",
        title: input.dictionary.generateWeeklyTitle,
        description: input.dictionary.generateWeeklyDescription,
        endpoint: "/api/cron/generate-weekly-content",
        method: "GET"
      },
      {
        id: "clear-topics-history",
        title: input.dictionary.clearTopicsTitle,
        description: input.dictionary.clearTopicsDescription,
        endpoint: "/api/cron/clear-topics-history",
        method: "GET"
      },
      {
        id: "publish-scheduled",
        title: input.dictionary.publishScheduledTitle,
        description: input.dictionary.publishScheduledDescription,
        endpoint: "/api/cron/publish-scheduled",
        method: "POST"
      },
      {
        id: "publish-weekly-preview",
        title: input.dictionary.publishWeeklyPreviewTitle,
        description: input.dictionary.publishWeeklyPreviewDescription,
        endpoint: "/api/content-system/publish-weekly-preview",
        method: "POST"
      },
      {
        id: "refresh-instagram",
        title: input.dictionary.refreshTokensTitle,
        description: input.dictionary.refreshTokensDescription,
        endpoint: "/api/cron/refresh-instagram-tokens",
        method: "POST"
      }
    ],
    [input.dictionary]
  );

  function getHumanSummary(actionId: AutomationAction["id"], parsed: unknown) {
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (actionId === "generate-weekly") {
      if (candidate.skipped === true) {
        return `${input.dictionary.summaryLabel} ${input.dictionary.weeklySkipped}`;
      }

      if (typeof candidate.generated === "number") {
        return `${input.dictionary.summaryLabel} ${candidate.generated} ${input.dictionary.itemsGenerated}`;
      }
    }

    if (actionId === "clear-topics-history") {
      if (candidate.skipped === true && typeof candidate.frequency === "string") {
        return `${input.dictionary.summaryLabel} ${input.dictionary.cleanupSkipped} (${candidate.frequency})`;
      }

      if (typeof candidate.clearedEntries === "number") {
        return `${input.dictionary.summaryLabel} ${candidate.clearedEntries} ${input.dictionary.itemsCleared}`;
      }
    }

    if (actionId === "publish-scheduled" && typeof candidate.processed === "number") {
      return `${input.dictionary.summaryLabel} ${candidate.processed} ${input.dictionary.itemsProcessed}`;
    }

    if (actionId === "publish-weekly-preview") {
      const published = typeof candidate.published === "number" ? candidate.published : 0;
      const failed = typeof candidate.failed === "number" ? candidate.failed : 0;
      return `${input.dictionary.summaryLabel} ${published} ${input.dictionary.itemsPublished}, ${failed} ${input.dictionary.itemsFailed}`;
    }

    if (actionId === "refresh-instagram" && typeof candidate.refreshed === "number") {
      return `${input.dictionary.summaryLabel} ${candidate.refreshed} ${input.dictionary.tokensRefreshed}`;
    }

    return null;
  }

  async function ensureAgendaOptions() {
    if (agendaOptions.length > 0) {
      return agendaOptions;
    }

    const json = await fetchAgenda();
    const nextAgenda = json.agenda ?? [];
    setAgendaOptions(nextAgenda);
    return nextAgenda;
  }

  function runAction(action: AutomationAction) {
    setStates((current) => ({
      ...current,
      [action.id]: {
        loading: true,
        status: null,
        result: null,
        parsed: null,
        error: null
      }
    }));

    startTransition(async () => {
      try {
        const body =
          action.id === "publish-weekly-preview"
            ? JSON.stringify({
                selectedDate: selectedWeeklyDate === "all" ? undefined : selectedWeeklyDate
              })
            : undefined;

        if (action.id === "publish-weekly-preview") {
          await ensureAgendaOptions();
        }

        const { response, parsed, formatted } = await runAutomationAction({
          endpoint: action.endpoint,
          method: action.method,
          body
        });

        setStates((current) => ({
          ...current,
          [action.id]: {
            loading: false,
            status: response.status,
            result: formatted,
            parsed,
            error: response.ok ? null : formatted || input.dictionary.requestFailed
          }
        }));
      } catch (error) {
        setStates((current) => ({
          ...current,
          [action.id]: {
            loading: false,
            status: null,
            result: null,
            parsed: null,
            error: error instanceof Error ? error.message : input.dictionary.requestFailed
          }
        }));
      }
    });
  }

  return {
    isPending,
    states,
    actions,
    agendaOptions,
    selectedWeeklyDate,
    setSelectedWeeklyDate,
    getHumanSummary,
    ensureAgendaOptions,
    runAction
  };
}
