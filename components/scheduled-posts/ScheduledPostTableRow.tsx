"use client";

import { PreviewCell } from "./PreviewCell";
import type { GeneratorDictionary, ScheduledPostItem, ScheduledPostsDictionary } from "./types";
import {
  formatDate,
  getAssetLabel,
  getPostTypeLabel,
  getPublicationStateLabel,
  getStatusLabel
} from "./utils";

export function ScheduledPostTableRow({
  post,
  locale,
  dictionary,
  generatorDictionary,
  highlightPostId,
  selected,
  scheduleValue,
  savingPostId,
  onToggle,
  onScheduleChange,
  onUpdateSchedule
}: {
  post: ScheduledPostItem;
  locale: string;
  dictionary: ScheduledPostsDictionary;
  generatorDictionary: GeneratorDictionary;
  highlightPostId?: string;
  selected: boolean;
  scheduleValue: string;
  savingPostId: string | null;
  onToggle: () => void;
  onScheduleChange: (value: string) => void;
  onUpdateSchedule: () => void;
}) {
  const isEditable = post.status !== "PUBLISHED";
  const isSavingThisPost = savingPostId === post.id;
  const publicationStateLabel = getPublicationStateLabel(post.publicationState, dictionary);

  return (
    <tr
      className={
        post.id === highlightPostId
          ? "border-t border-amber-200 bg-amber-50/70 align-top"
          : "border-t border-slate-100 align-top"
      }
    >
      <td className="px-2 py-2.5 sm:px-3 sm:py-3">
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={dictionary.select} />
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3">
        <PreviewCell
          imageUrl={post.previewUrl}
          assetState={post.assetState}
          alt={dictionary.previewAlt}
          unavailableLabel={dictionary.previewUnavailable}
        />
      </td>
      <td className="max-w-[220px] px-2 py-2.5 text-slate-700 sm:max-w-[260px] sm:px-3 sm:py-3">
        <p className="line-clamp-2 whitespace-pre-wrap break-words sm:line-clamp-3">{post.caption}</p>
      </td>
      <td className="px-2 py-2.5 text-slate-600 sm:px-3 sm:py-3">
        {getPostTypeLabel(post.postType, generatorDictionary)}
      </td>
      <td className="min-w-[170px] px-2 py-2.5 text-slate-600 sm:min-w-[200px] sm:px-3 sm:py-3">
        {isEditable ? (
          <div className="space-y-2">
            <input
              type="datetime-local"
              value={scheduleValue}
              onChange={(event) => onScheduleChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-slate-400 sm:px-3 sm:text-sm"
            />
            <p className="text-xs text-slate-400">{formatDate(post.scheduledTime, locale)}</p>
          </div>
        ) : (
          formatDate(post.scheduledTime, locale)
        )}
      </td>
      <td className="px-2 py-2.5 text-slate-600 sm:px-3 sm:py-3">
        {formatDate(post.publishedAt, locale)}
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3">
        <div className="space-y-1">
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:px-3 sm:text-xs sm:tracking-[0.16em]">
            {getStatusLabel(post.status, dictionary)}
          </span>
          {publicationStateLabel ? (
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:text-[11px]">
              {publicationStateLabel}
            </p>
          ) : null}
        </div>
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:px-3 sm:text-xs sm:tracking-[0.16em]">
          {getAssetLabel(post.assetState, dictionary)}
        </span>
      </td>
      <td className="px-2 py-2.5 sm:px-3 sm:py-3">
        {isEditable ? (
          <button
            type="button"
            onClick={onUpdateSchedule}
            disabled={isSavingThisPost}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
          >
            {isSavingThisPost
              ? dictionary.saving
              : post.status === "FAILED"
                ? dictionary.reschedule
                : dictionary.editSchedule}
          </button>
        ) : (
          <span className="text-sm text-slate-400">-</span>
        )}
      </td>
    </tr>
  );
}
