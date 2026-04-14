"use client";

import { AiMetadataDiagnostics } from "@/components/automation-diagnostics/AiMetadataDiagnostics";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/shared";
import { useAutomationDiagnostics } from "@/hooks/useAutomationDiagnostics";

export function AutomationDiagnostics() {
  const { dictionary } = useI18n();
  const {
    isPending,
    states,
    actions,
    agendaOptions,
    selectedWeeklyDate,
    setSelectedWeeklyDate,
    getHumanSummary,
    ensureAgendaOptions,
    runAction
  } = useAutomationDiagnostics({
    dictionary: {
      generateWeeklyTitle: dictionary.automationDiagnostics.generateWeeklyTitle,
      generateWeeklyDescription: dictionary.automationDiagnostics.generateWeeklyDescription,
      clearTopicsTitle: dictionary.automationDiagnostics.clearTopicsTitle,
      clearTopicsDescription: dictionary.automationDiagnostics.clearTopicsDescription,
      publishScheduledTitle: dictionary.automationDiagnostics.publishScheduledTitle,
      publishScheduledDescription: dictionary.automationDiagnostics.publishScheduledDescription,
      publishWeeklyPreviewTitle: dictionary.automationDiagnostics.publishWeeklyPreviewTitle,
      publishWeeklyPreviewDescription:
        dictionary.automationDiagnostics.publishWeeklyPreviewDescription,
      refreshTokensTitle: dictionary.automationDiagnostics.refreshTokensTitle,
      refreshTokensDescription: dictionary.automationDiagnostics.refreshTokensDescription,
      summaryLabel: dictionary.automationDiagnostics.summaryLabel,
      weeklySkipped: dictionary.automationDiagnostics.weeklySkipped,
      itemsGenerated: dictionary.automationDiagnostics.itemsGenerated,
      cleanupSkipped: dictionary.automationDiagnostics.cleanupSkipped,
      itemsCleared: dictionary.automationDiagnostics.itemsCleared,
      itemsProcessed: dictionary.automationDiagnostics.itemsProcessed,
      itemsPublished: dictionary.automationDiagnostics.itemsPublished,
      itemsFailed: dictionary.automationDiagnostics.itemsFailed,
      tokensRefreshed: dictionary.automationDiagnostics.tokensRefreshed,
      requestFailed: dictionary.automationDiagnostics.requestFailed
    }
  });

  const orderedActions = [actions[0], actions[1], actions[2], actions[3], actions[4]];

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

      <AiMetadataDiagnostics
        dictionary={{
          title: dictionary.automationDiagnostics.aiMetadataTitle,
          description: dictionary.automationDiagnostics.aiMetadataDescription,
          uploading: dictionary.automationDiagnostics.aiMetadataUploading,
          selectFile: dictionary.automationDiagnostics.aiMetadataSelectFile,
          noResult: dictionary.automationDiagnostics.aiMetadataNoResult,
          exiftoolMissing: dictionary.automationDiagnostics.aiMetadataExiftoolMissing,
          aiMetadataDetected: dictionary.automationDiagnostics.aiMetadataDetected,
          aiMetadataMissing: dictionary.automationDiagnostics.aiMetadataMissing,
          expectedLabel: dictionary.automationDiagnostics.aiMetadataExpectedLabel,
          rawOutput: dictionary.automationDiagnostics.aiMetadataRawOutput
        }}
      />

      <div className="grid gap-6">
        {orderedActions.map((action) => {
          const state = states[action.id];
          const summary = state?.parsed ? getHumanSummary(action.id, state.parsed) : null;

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
