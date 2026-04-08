"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/ui";
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

export function AutomationDiagnostics() {
  const { dictionary } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const [agendaOptions, setAgendaOptions] = useState<ContentPlanItem[]>([]);
  const [selectedWeeklyDate, setSelectedWeeklyDate] = useState<string>("all");

  const actions: AutomationAction[] = [
    {
      id: "generate-weekly",
      title: dictionary.automationDiagnostics.generateWeeklyTitle,
      description: dictionary.automationDiagnostics.generateWeeklyDescription,
      endpoint: "/api/cron/generate-weekly-content",
      method: "GET"
    },
    {
      id: "clear-topics-history",
      title: dictionary.automationDiagnostics.clearTopicsTitle,
      description: dictionary.automationDiagnostics.clearTopicsDescription,
      endpoint: "/api/cron/clear-topics-history",
      method: "GET"
    },
    {
      id: "publish-scheduled",
      title: dictionary.automationDiagnostics.publishScheduledTitle,
      description: dictionary.automationDiagnostics.publishScheduledDescription,
      endpoint: "/api/cron/publish-scheduled",
      method: "POST"
    },
    {
      id: "publish-weekly-preview",
      title: dictionary.automationDiagnostics.publishWeeklyPreviewTitle,
      description: dictionary.automationDiagnostics.publishWeeklyPreviewDescription,
      endpoint: "/api/content-system/publish-weekly-preview",
      method: "POST"
    },
    {
      id: "refresh-instagram",
      title: dictionary.automationDiagnostics.refreshTokensTitle,
      description: dictionary.automationDiagnostics.refreshTokensDescription,
      endpoint: "/api/cron/refresh-instagram-tokens",
      method: "POST"
    }
  ];

  function getHumanSummary(actionId: AutomationAction["id"], parsed: unknown) {
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;

    if (actionId === "generate-weekly") {
      if (candidate.skipped === true) {
        return `${dictionary.automationDiagnostics.summaryLabel} ${dictionary.automationDiagnostics.weeklySkipped}`;
      }

      if (typeof candidate.generated === "number") {
        return `${dictionary.automationDiagnostics.summaryLabel} ${candidate.generated} ${dictionary.automationDiagnostics.itemsGenerated}`;
      }
    }

    if (actionId === "clear-topics-history") {
      if (candidate.skipped === true && typeof candidate.frequency === "string") {
        return `${dictionary.automationDiagnostics.summaryLabel} ${dictionary.automationDiagnostics.cleanupSkipped} (${candidate.frequency})`;
      }

      if (typeof candidate.clearedEntries === "number") {
        return `${dictionary.automationDiagnostics.summaryLabel} ${candidate.clearedEntries} ${dictionary.automationDiagnostics.itemsCleared}`;
      }
    }

    if (actionId === "publish-scheduled" && typeof candidate.processed === "number") {
      return `${dictionary.automationDiagnostics.summaryLabel} ${candidate.processed} ${dictionary.automationDiagnostics.itemsProcessed}`;
    }

    if (actionId === "publish-weekly-preview") {
      const published = typeof candidate.published === "number" ? candidate.published : 0;
      const failed = typeof candidate.failed === "number" ? candidate.failed : 0;
      return `${dictionary.automationDiagnostics.summaryLabel} ${published} ${dictionary.automationDiagnostics.itemsPublished}, ${failed} ${dictionary.automationDiagnostics.itemsFailed}`;
    }

    if (actionId === "refresh-instagram" && typeof candidate.refreshed === "number") {
      return `${dictionary.automationDiagnostics.summaryLabel} ${candidate.refreshed} ${dictionary.automationDiagnostics.tokensRefreshed}`;
    }

    return null;
  }

  async function ensureAgendaOptions() {
    if (agendaOptions.length > 0) {
      return agendaOptions;
    }

    const response = await fetch("/api/content-system/agenda");
    const json = (await response.json()) as { agenda?: ContentPlanItem[] };
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

        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body
        });

        const text = await response.text();
        const parsed = (() => {
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return null;
          }
        })();
        const formatted = parsed ? JSON.stringify(parsed, null, 2) : text;

        setStates((current) => ({
          ...current,
          [action.id]: {
            loading: false,
            status: response.status,
            result: formatted,
            parsed,
            error: response.ok ? null : formatted || dictionary.automationDiagnostics.requestFailed
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
            error:
              error instanceof Error
                ? error.message
                : dictionary.automationDiagnostics.requestFailed
          }
        }));
      }
    });
  }

  const orderedActions = [
    actions[0],
    actions[1],
    actions[2],
    actions[3],
    actions[4]
  ];

  return (
    <div className="space-y-6">
      <Panel className="p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {dictionary.automationDiagnostics.helpTitle}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {dictionary.automationDiagnostics.helpDescription}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {dictionary.automationDiagnostics.sectionRealtime}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {dictionary.automationDiagnostics.sectionRealtimeDescription}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {dictionary.automationDiagnostics.sectionSafety}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {dictionary.automationDiagnostics.sectionSafetyDescription}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6">
        {orderedActions.map((action) => {
          const state = states[action.id];
          const summary = state?.parsed
            ? getHumanSummary(action.id, state.parsed)
            : null;

          return (
            <Panel key={action.id} className="overflow-hidden p-0">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-lg font-semibold text-ink">{action.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => runAction(action)}
                    disabled={state?.loading || isPending}
                    className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {state?.loading
                      ? dictionary.automationDiagnostics.running
                      : dictionary.automationDiagnostics.runAction}
                  </button>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  {action.id === "publish-weekly-preview" ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <label className="block text-sm font-medium text-slate-700">
                        <span>{dictionary.automationDiagnostics.publishWeeklyPreviewDay}</span>
                        <select
                          value={selectedWeeklyDate}
                          onFocus={() => {
                            void ensureAgendaOptions();
                          }}
                          onChange={(event) => setSelectedWeeklyDate(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                        >
                          <option value="all">
                            {dictionary.automationDiagnostics.publishWeeklyPreviewAllDays}
                          </option>
                          {agendaOptions.map((item) => (
                            <option key={`${item.date}-${item.theme}`} value={item.date}>
                              {item.day} - {item.date} - {item.theme}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-950 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Endpoint
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-100">
                      {action.method} {action.endpoint}
                    </p>
                  </div>

                  {state?.result ? (
                    <pre className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
                      {state.result}
                    </pre>
                  ) : null}
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {dictionary.automationDiagnostics.lastStatus}
                    </p>
                    <div className="mt-3">
                      <span
                        className={
                          state?.error
                            ? "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700"
                            : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                        }
                      >
                        {state?.status ?? dictionary.automationDiagnostics.notRunYet}
                      </span>
                    </div>
                    {summary ? (
                      <p className="mt-4 text-sm text-slate-600">{summary}</p>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        {dictionary.automationDiagnostics.awaitingRun}
                      </p>
                    )}
                  </div>

                  {state?.error ? (
                    <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
                      {state.error}
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
