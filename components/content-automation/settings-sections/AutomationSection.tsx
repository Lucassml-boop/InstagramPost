import { Panel } from "@/components/shared";
import type { SettingsSectionsProps } from "./types";

export function AutomationSection(props: SettingsSectionsProps) {
  const { dictionary } = props;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.automationSection}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.automationDescription}</p>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={props.saveSettings} disabled={props.isSaving || props.isGenerating} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {props.isSaving ? dictionary.contentAutomation.saving : dictionary.contentAutomation.saveButton}
          </button>
          <button type="button" onClick={props.generateWeeklyAgenda} disabled={props.isSaving || props.isGenerating} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">
            {props.isGenerating ? dictionary.contentAutomation.generating : dictionary.contentAutomation.generateButton}
          </button>
          {props.isGenerating ? (
            <button type="button" onClick={props.cancelWeeklyGeneration} className="rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800">
              {dictionary.contentAutomation.cancelGeneration ?? "Cancelar"}
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-slate-600">{dictionary.contentAutomation.generateHint}</p>
        {props.currentTopics.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.currentTopics}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {props.currentTopics.map((topic) => <span key={topic} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{topic}</span>)}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
