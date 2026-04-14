"use client";

import { ChangeEvent, useState } from "react";
import { Panel } from "@/components/shared";
import { inspectAiMetadata } from "@/services/frontend/posts";

type Props = {
  dictionary: {
    title: string;
    description: string;
    uploading: string;
    selectFile: string;
    noResult: string;
    exiftoolMissing: string;
    aiMetadataDetected: string;
    aiMetadataMissing: string;
    expectedLabel: string;
    rawOutput: string;
  };
};

export function AiMetadataDiagnostics({ dictionary }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | {
    exiftoolAvailable: boolean;
    expectedDigitalSourceType: string;
    detected: {
      digitalSourceType: string | null;
      creator: string | null;
      creatorTool: string | null;
      description: string | null;
      credit: string | null;
      rights: string | null;
    };
    hasAiMetadata: boolean;
    rawOutput: Record<string, unknown> | null;
  }>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextResult = await inspectAiMetadata(file);
      setResult(nextResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Inspection failed.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-lg font-semibold text-ink">{dictionary.title}</p>
          <p className="mt-2 text-sm text-slate-600">{dictionary.description}</p>
        </div>

        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <input type="file" accept="image/*" onChange={handleChange} className="block text-sm" />
          <p className="mt-2 text-sm text-slate-500">
            {isLoading ? dictionary.uploading : dictionary.selectFile}
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            {!result.exiftoolAvailable ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {dictionary.exiftoolMissing}
              </div>
            ) : (
              <div
                className={
                  result.hasAiMetadata
                    ? "rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                    : "rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                }
              >
                {result.hasAiMetadata
                  ? dictionary.aiMetadataDetected
                  : dictionary.aiMetadataMissing}
              </div>
            )}

            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {dictionary.expectedLabel}
                </p>
                <p className="mt-2 break-all text-sm text-ink">
                  {result.expectedDigitalSourceType}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  DigitalSourceType
                </p>
                <p className="mt-2 break-all text-sm text-ink">
                  {result.detected.digitalSourceType ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Creator
                </p>
                <p className="mt-2 break-all text-sm text-ink">{result.detected.creator ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  CreatorTool
                </p>
                <p className="mt-2 break-all text-sm text-ink">
                  {result.detected.creatorTool ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Description
                </p>
                <p className="mt-2 break-all text-sm text-ink">
                  {result.detected.description ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Credit
                </p>
                <p className="mt-2 break-all text-sm text-ink">{result.detected.credit ?? "-"}</p>
              </div>
            </div>

            {result.rawOutput ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {dictionary.rawOutput}
                </p>
                <pre className="mt-2 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
                  {JSON.stringify(result.rawOutput, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {dictionary.noResult}
          </div>
        )}
      </div>
    </Panel>
  );
}
