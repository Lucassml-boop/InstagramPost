import { Panel } from "@/components/shared";
import type { SettingsSectionsProps } from "./types";

export function StrategySection(props: SettingsSectionsProps) {
  const { dictionary } = props;

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
