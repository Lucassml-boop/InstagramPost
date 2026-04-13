"use client";

export function AutoFieldButton({
  isLoading,
  idleLabel,
  loadingLabel,
  onClick
}: {
  isLoading: boolean;
  idleLabel: string;
  loadingLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? loadingLabel : idleLabel}
    </button>
  );
}
