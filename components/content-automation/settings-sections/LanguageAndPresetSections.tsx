import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Panel } from "@/components/shared";
import type { SettingsSectionsProps } from "./types";

export function LanguageSection({ dictionary }: Pick<SettingsSectionsProps, "dictionary">) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.settingsTab}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.presetLibraryDescription}</p>
      </div>
      <div className="p-6"><LanguageSwitcher /></div>
    </Panel>
  );
}

export function PresetLibrarySection(props: SettingsSectionsProps) {
  const { dictionary } = props;
  const fields = [
    ["goalPresets", dictionary.contentAutomation.goalPresets, props.presets.goalPresets],
    ["contentTypePresets", dictionary.contentAutomation.contentTypePresets, props.presets.contentTypePresets],
    ["formatPresets", dictionary.contentAutomation.formatPresets, props.presets.formatPresets]
  ] as const;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.presetLibraryTitle}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.presetLibraryDescription}</p>
      </div>
      <div className="p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {fields.map(([key, label, value]) => (
            <label key={key} className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{label}</span>
                {props.renderAutoButton(key, () => props.runAutomaticSetting({ key, target: key as "goalPresets" | "contentTypePresets" | "formatPresets", currentValue: value, apply: (nextValue) => props.updatePreset(key as "goalPresets" | "contentTypePresets" | "formatPresets", nextValue) }))}
              </div>
              <textarea value={value} onChange={(event) => props.updatePreset(key as "goalPresets" | "contentTypePresets" | "formatPresets", event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{dictionary.contentAutomation.savedPresetsHint}</p>
      </div>
    </Panel>
  );
}
