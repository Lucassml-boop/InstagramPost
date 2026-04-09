"use client";

import { formatDuration } from "./utils";

export function GenerationProgress({
  progressValue,
  elapsedMs,
  clientTimeoutMs,
  title,
  estimate,
  elapsedLabel,
  slowMessage
}: {
  progressValue: number;
  elapsedMs: number;
  clientTimeoutMs: number;
  title: string;
  estimate: string;
  elapsedLabel: string;
  slowMessage?: string | null;
}) {
  return (
    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{estimate}</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-slate-700">
          {Math.round(progressValue)}%
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand via-amber-400 to-emerald-500 transition-[width] duration-300 ease-out"
          style={{ width: `${progressValue}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressValue)}
          aria-label={title}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {elapsedLabel}: {formatDuration(elapsedMs)}
        </span>
        <span>~ {formatDuration(clientTimeoutMs)}</span>
      </div>

      {slowMessage ? <p className="mt-3 text-sm text-amber-700">{slowMessage}</p> : null}
    </div>
  );
}
