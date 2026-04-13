import { Panel } from "@/components/shared";
import { DEFAULT_CUSTOM_INSTRUCTIONS } from "@/components/create-post/constants";
import type { BriefingFieldDefinition, AppDictionary, AutoButtonRenderer } from "./types";
import type { BriefingFieldId } from "@/lib/briefing-builder";

export function BriefingEditorSection({
  dictionary,
  briefingMode,
  briefingFieldDefinitions,
  guidedBriefingFields,
  updateGuidedBriefingField,
  guidedBriefingPrompt,
  customInstructions,
  setCustomInstructions,
  renderAutoButton,
  generatePromptInstructions,
  clearGuidedBriefing
}: {
  dictionary: AppDictionary;
  briefingMode: "guided" | "prompt";
  briefingFieldDefinitions: BriefingFieldDefinition[];
  guidedBriefingFields: Record<BriefingFieldId, string>;
  updateGuidedBriefingField: (field: BriefingFieldId, value: string) => void;
  guidedBriefingPrompt: string;
  customInstructions: string;
  setCustomInstructions: (value: string) => void;
  renderAutoButton: AutoButtonRenderer;
  generatePromptInstructions: () => Promise<void> | void;
  clearGuidedBriefing: () => void;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {briefingMode === "guided"
                ? dictionary.generator.guidedBriefingTitle
                : dictionary.generator.customInstructions}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {briefingMode === "guided"
                ? dictionary.generator.guidedBriefingDescription
                : dictionary.generator.customInstructionsDescription}
            </p>
          </div>
          {briefingMode === "prompt"
            ? renderAutoButton("customInstructions", generatePromptInstructions)
            : null}
        </div>
      </div>
      <div className="p-6">
        {briefingMode === "guided" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              {briefingFieldDefinitions.map(([fieldId, label]) => (
                <label
                  key={fieldId}
                  className={`block text-sm font-medium text-slate-700 ${
                    fieldId === "businessSummary" || fieldId === "contentPillars" ? "md:col-span-2" : ""
                  }`}
                >
                  {label}
                  <textarea
                    value={guidedBriefingFields[fieldId]}
                    onChange={(event) => updateGuidedBriefingField(fieldId, event.target.value)}
                    rows={fieldId === "businessSummary" || fieldId === "contentPillars" ? 4 : 3}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                  />
                </label>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {dictionary.generator.guidedBriefingPreview}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {dictionary.generator.guidedBriefingPreviewDescription}
              </p>
              <textarea value={guidedBriefingPrompt} readOnly className="mt-4 min-h-72 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={clearGuidedBriefing} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink">
                {dictionary.generator.restoreGuidedBriefing}
              </button>
              <p className="text-xs text-slate-500">{dictionary.contentAutomation.autoGenerateSectionHint}</p>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={customInstructions}
              onChange={(event) => setCustomInstructions(event.target.value)}
              className="min-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              placeholder={dictionary.generator.customInstructionsPlaceholder}
            />
            <button type="button" onClick={() => setCustomInstructions(DEFAULT_CUSTOM_INSTRUCTIONS)} className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink">
              {dictionary.generator.restoreDefaultInstructions}
            </button>
          </>
        )}
      </div>
    </Panel>
  );
}
