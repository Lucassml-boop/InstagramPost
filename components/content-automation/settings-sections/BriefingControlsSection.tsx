import { Panel } from "@/components/shared";
import type { AppDictionary } from "./types";

export function BriefingControlsSection({
  dictionary,
  outputLanguage,
  setOutputLanguage,
  briefingMode,
  setBriefingMode
}: {
  dictionary: AppDictionary;
  outputLanguage: "en" | "pt-BR";
  setOutputLanguage: (value: "en" | "pt-BR") => void;
  briefingMode: "guided" | "prompt";
  setBriefingMode: (value: "guided" | "prompt") => void;
}) {
  return (
    <>
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.generator.outputLanguage}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.generator.outputLanguageDescription}
          </p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {(["en", "pt-BR"] as const).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => setOutputLanguage(language)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                outputLanguage === language
                  ? "border-ink bg-white text-ink shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
              }`}
            >
              <span className="block text-sm font-semibold">
                {language === "en"
                  ? dictionary.generator.outputLanguageEnglish
                  : dictionary.generator.outputLanguagePtBR}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.generator.briefingMode}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.generator.briefingModeDescription}
          </p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2">
          {(["guided", "prompt"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBriefingMode(mode)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                briefingMode === mode
                  ? "border-ink bg-white text-ink shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
              }`}
            >
              <span className="block text-sm font-semibold">
                {mode === "guided"
                  ? dictionary.generator.briefingModeGuided
                  : dictionary.generator.briefingModePrompt}
              </span>
              <span className="mt-2 block text-xs text-slate-500">
                {mode === "guided"
                  ? dictionary.generator.briefingModeGuidedDescription
                  : dictionary.generator.briefingModePromptDescription}
              </span>
            </button>
          ))}
        </div>
      </Panel>
    </>
  );
}
