import type { AppDictionary } from "./types";

export function BriefingActionsBar({
  dictionary,
  generateAutomaticSettingsBundle,
  isAutoGeneratingAllSettings,
  saveGenerationSettings,
  isSavingGenerationSettings,
  generationSettingsMessage
}: {
  dictionary: AppDictionary;
  generateAutomaticSettingsBundle: () => void;
  isAutoGeneratingAllSettings: boolean;
  saveGenerationSettings: () => void;
  isSavingGenerationSettings: boolean;
  generationSettingsMessage: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={generateAutomaticSettingsBundle} disabled={isAutoGeneratingAllSettings} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">
        {isAutoGeneratingAllSettings ? dictionary.contentAutomation.autoGeneratingField : dictionary.contentAutomation.autoGenerateAll}
      </button>
      <button type="button" onClick={saveGenerationSettings} disabled={isSavingGenerationSettings} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
        {isSavingGenerationSettings ? dictionary.generator.generating : dictionary.common.save}
      </button>
      {generationSettingsMessage ? <p className="text-sm text-emerald-700">{generationSettingsMessage}</p> : null}
    </div>
  );
}
