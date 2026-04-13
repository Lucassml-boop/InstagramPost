import type { ReactNode } from "react";

export function renderAgendaMeta(label: string, value: string) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

export function parseTextareaItems(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function togglePresetInTextarea(currentValue: string, preset: string) {
  const normalizedPreset = preset.trim();

  if (!normalizedPreset) {
    return currentValue;
  }

  const nextItems = parseTextareaItems(currentValue);
  const hasPreset = nextItems.includes(normalizedPreset);

  return hasPreset
    ? nextItems.filter((item) => item !== normalizedPreset).join("\n")
    : [...nextItems, normalizedPreset].join("\n");
}

export function renderStatusMessage(message: string | null, error: string | null): ReactNode {
  if (!message && !error) {
    return null;
  }

  return (
    <div
      className={
        error
          ? "rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          : "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      }
    >
      {error ?? message}
    </div>
  );
}
