"use client";

import { createPortal } from "react-dom";
import type { ScheduledPostsDictionary } from "./types";
import { getSelectionCountLabel } from "./utils";

export function SelectionToolbar({
  portalReady,
  selectedCount,
  dictionary,
  isDeleting,
  onClear,
  onDelete
}: {
  portalReady: boolean;
  selectedCount: number;
  dictionary: ScheduledPostsDictionary;
  isDeleting: boolean;
  onClear: () => void;
  onDelete: () => void;
}) {
  if (!portalReady || selectedCount === 0) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
        <span className="whitespace-nowrap text-sm font-medium text-slate-700">
          {getSelectionCountLabel(selectedCount, dictionary)}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {dictionary.clearSelection}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? dictionary.deleting : dictionary.deleteSelected}
        </button>
      </div>
    </div>,
    document.body
  );
}
