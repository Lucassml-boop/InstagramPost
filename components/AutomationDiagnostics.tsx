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
        const formatted = (() => {
          try {
            return JSON.stringify(JSON.parse(text), null, 2);
          } catch {
            return text;
          }
        })();

        setStates((current) => ({
          ...current,
          [action.id]: {
            loading: false,
            status: response.status,
            result: formatted,
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
        <p className="text-sm font-semibold text-ink">
          {dictionary.automationDiagnostics.helpTitle}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.automationDiagnostics.helpDescription}
        </p>
      </Panel>

      <div className="grid gap-4">
        {orderedActions.map((action) => {
          const state = states[action.id];

          return (
            <Panel key={action.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-lg font-semibold text-ink">{action.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                  {action.id === "publish-weekly-preview" ? (
                    <div className="mt-4">
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
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {action.method} {action.endpoint}
                  </p>
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

              {state ? (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-slate-600">
                      {dictionary.automationDiagnostics.lastStatus}
                    </span>
                    <span
                      className={
                        state.error
                          ? "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700"
                          : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
                      }
                    >
                      {state.status ?? dictionary.automationDiagnostics.notRunYet}
                    </span>
                  </div>

                  {state.error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {state.error}
                    </div>
                  ) : null}

                  {state.result ? (
                    <pre className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
                      {state.result}
                    </pre>
                  ) : null}
                </div>
              ) : null}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
