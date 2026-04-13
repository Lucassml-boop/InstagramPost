import { parseTextareaItems } from "@/components/content-automation/helpers";
import type { AppDictionary } from "./types";

export function AutoActionButton({
  isLoading,
  label
}: {
  isLoading: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={isLoading}
      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export function PresetPicker({
  dictionary,
  isOpen,
  isAutoLoading,
  presetsList,
  value,
  multiselect,
  onToggle,
  onAuto,
  onSelectPreset
}: {
  dictionary: AppDictionary;
  isOpen: boolean;
  isAutoLoading: boolean;
  presetsList: string[];
  value: string;
  multiselect?: boolean;
  onToggle: () => void;
  onAuto: () => void;
  onSelectPreset: (preset: string) => void;
}) {
  const selectedItems = parseTextareaItems(value);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
        aria-label={dictionary.contentAutomation.chooseSavedPreset}
      >
        +
      </button>

      {isOpen ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {dictionary.contentAutomation.chooseSavedPreset}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isAutoLoading}
              onClick={onAuto}
              className="rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAutoLoading
                ? dictionary.contentAutomation.autoGeneratingField
                : dictionary.contentAutomation.autoGenerateField}
            </button>

            {presetsList.map((preset) => {
              const isSelected = multiselect
                ? selectedItems.includes(preset)
                : value.trim() === preset;

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? "border-ink bg-ink text-white"
                      : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-ink"
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {presetsList.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              {dictionary.contentAutomation.noSavedPresets}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
