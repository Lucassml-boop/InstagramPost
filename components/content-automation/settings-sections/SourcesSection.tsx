import { Panel } from "@/components/shared";
import type { SettingsSectionsProps } from "./types";

export function SourcesSection(props: SettingsSectionsProps) {
  const { dictionary } = props;
  const fields = [
    ["services", "services", dictionary.contentAutomation.services, props.services, props.setServices],
    ["contentRules", "contentRules", dictionary.contentAutomation.contentRules, props.contentRules, props.setContentRules],
    ["researchQueries", "researchQueries", dictionary.contentAutomation.researchQueries, props.researchQueries, props.setResearchQueries],
    ["carouselDefaultStructure", "carouselDefaultStructure", dictionary.contentAutomation.carouselDefaultStructure, props.carouselDefaultStructure, props.setCarouselDefaultStructure]
  ] as const;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.sourcesSection}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.sourcesDescription}</p>
      </div>
      <div className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map(([key, target, label, value, setter]) => (
            <label key={key} className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{label}</span>
                {props.renderAutoButton(key, () => props.runAutomaticSetting({ key, target, currentValue: value, apply: setter }))}
              </div>
              <textarea value={value} onChange={(event) => setter(event.target.value)} rows={8} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{dictionary.contentAutomation.listHint}</p>
      </div>
    </Panel>
  );
}
