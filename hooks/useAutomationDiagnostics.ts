"use client";

import { useMemo, useState, useTransition } from "react";
import { fetchAgenda, runAutomationAction } from "@/services/frontend/content-system";
import type { ContentPlanItem } from "@/lib/content-system";
import {
  buildAutomationActions,
  getHumanSummary,
  loadAgendaOptions,
  type ActionState,
  type AutomationAction
} from "@/hooks/automation-diagnostics-helpers";

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
    () => buildAutomationActions(input.dictionary),
    [input.dictionary]
  );

  async function ensureAgendaOptions() {
    return loadAgendaOptions(agendaOptions, fetchAgenda, setAgendaOptions);
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
    getHumanSummary: (actionId: AutomationAction["id"], parsed: unknown) =>
      getHumanSummary(input.dictionary, actionId, parsed),
    ensureAgendaOptions,
    runAction
  };
}
