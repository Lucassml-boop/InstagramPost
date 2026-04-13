import { Panel } from "@/components/shared";
import type { SettingsSectionsProps } from "./types";

export function MemorySection(props: SettingsSectionsProps) {
  const { dictionary } = props;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.memorySection}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.memoryDescription}</p>
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{dictionary.contentAutomation.topicsHistoryTitle}</p>
            <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.topicsHistoryDescription}</p>
          </div>
          <button type="button" onClick={props.clearTopicsHistory} disabled={props.isSaving || props.isGenerating} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">
            {dictionary.contentAutomation.clearTopicsHistory}
          </button>
        </div>
        {props.uniqueTopicsHistory.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">{dictionary.contentAutomation.noTopicsHistory}</p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {props.uniqueTopicsHistory.map((topic) => <span key={topic} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{topic}</span>)}
          </div>
        )}
      </div>
    </Panel>
  );
}
