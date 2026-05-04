"use client";

import type { GeneratorErrorState } from "./types";

type SimilarPostError = Extract<GeneratorErrorState, { type: "similar-manual-post" }>;

export function SimilarPostErrorPanel({
  error,
  isGenerating,
  onContinue
}: {
  error: SimilarPostError;
  isGenerating: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-2">
        {error.similarPost.details.map((detail) => (
          <div key={`${detail.field}-${detail.label}`} className="rounded-xl bg-white/60 px-3 py-2">
            <p className="font-semibold text-red-800">{detail.label}</p>
            <p className="mt-1 text-red-700">Novo: {detail.candidateValue || "-"}</p>
            <p className="text-red-700">Post salvo: {detail.existingValue || "-"}</p>
            {detail.overlapKeywords?.length ? (
              <p className="text-red-700">
                Palavras em comum: {detail.overlapKeywords.join(", ")}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <a
        href={error.similarPost.href}
        className="inline-flex rounded-full border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
      >
        Abrir post semelhante
      </a>
      <button
        type="button"
        onClick={onContinue}
        disabled={isGenerating}
        className="inline-flex rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
      >
        Seguir mesmo assim
      </button>
    </div>
  );
}
