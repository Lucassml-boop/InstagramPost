"use client";

function buildManualFocusSummary(input: {
  topic: string;
  message: string;
  keywords: string;
}) {
  const parts = [input.topic.trim(), input.message.trim(), input.keywords.trim()].filter(Boolean);
  return parts.length === 0 ? "" : parts.join(" | ");
}

export function CaptionGeneratorControls(input: {
  dictionary: any;
  isGenerating: boolean;
  isAutoGeneratingAll: boolean;
  openAutoGenerateAllModal: () => void;
  generatePost: () => void;
  cancelGeneration: () => void;
  clearFocusHints: () => void;
  lastAutoGenerateTopicHint: string;
  topic: string;
  message: string;
  keywords: string;
}) {
  const { dictionary } = input;
  const manualFocusSummary = buildManualFocusSummary(input);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        {!input.isGenerating ? (
          <>
            <button
              type="button"
              onClick={input.openAutoGenerateAllModal}
              disabled={input.isAutoGeneratingAll}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
            >
              {input.isAutoGeneratingAll
                ? dictionary.generator.autoGeneratingField
                : dictionary.generator.autoGenerateAllFields}
            </button>
            <button
              type="button"
              onClick={input.generatePost}
              disabled={input.isGenerating}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {input.isGenerating ? dictionary.generator.generating : dictionary.generator.generate}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={input.cancelGeneration}
            className="rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100"
          >
            {dictionary.generator.cancelGeneration}
          </button>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {dictionary.generator.focusSummaryTitle}
          </p>
          <button
            type="button"
            onClick={input.clearFocusHints}
            className="text-xs font-semibold text-slate-600 transition hover:text-ink"
          >
            {dictionary.generator.focusSummaryClear}
          </button>
        </div>
        <p className="mt-2">
          <span className="font-semibold text-ink">
            {dictionary.generator.focusSummaryAutoLabel}:
          </span>{" "}
          {input.lastAutoGenerateTopicHint || dictionary.generator.focusSummaryNone}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-ink">
            {dictionary.generator.focusSummaryGenerateLabel}:
          </span>{" "}
          {dictionary.generator.focusSummaryNone}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-ink">
            {dictionary.generator.focusSummaryManualLabel}:
          </span>{" "}
          {manualFocusSummary || dictionary.generator.focusSummaryNone}
        </p>
      </div>
    </div>
  );
}
