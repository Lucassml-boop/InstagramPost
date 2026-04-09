"use client";

import Image from "next/image";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { PreviewCell } from "./PreviewCell";
import { SelectionToolbar } from "./SelectionToolbar";
import type {
  GeneratorDictionary,
  InstagramFeedItem,
  ScheduledPostItem,
  ScheduledPostsDictionary
} from "./types";
import {
  formatDate,
  getAssetLabel,
  getPostTypeLabel,
  getStatusLabel,
  normalizePreviewSrc
} from "./utils";

export function ScheduledPostsTable({
  posts,
  instagramFeedItems,
  instagramFeedError,
  locale,
  dictionary,
  generatorDictionary
}: {
  posts: ScheduledPostItem[];
  instagramFeedItems: InstagramFeedItem[];
  instagramFeedError: string | null;
  locale: string;
  dictionary: ScheduledPostsDictionary;
  generatorDictionary: GeneratorDictionary;
}) {
  const {
    portalReady,
    feedback,
    scheduleValues,
    setScheduleValues,
    savingPostId,
    selectedPostIds,
    isDeleting,
    counts,
    allDeletableSelected,
    clearSelection,
    toggleSelection,
    toggleSelectAll,
    updateSchedule,
    deleteSelectedPosts
  } = useScheduledPosts({
    posts,
    dictionary: {
      scheduleRequired: dictionary.scheduleRequired,
      updateError: dictionary.updateError,
      updatedSuccess: dictionary.updatedSuccess,
      selectAtLeastOne: dictionary.selectAtLeastOne,
      deleteError: dictionary.deleteError,
      deleteSuccess: dictionary.deleteSuccess
    }
  });

  return (
    <div className="space-y-6">
      <SelectionToolbar
        portalReady={portalReady}
        selectedCount={selectedPostIds.length}
        dictionary={dictionary}
        isDeleting={isDeleting}
        onClear={clearSelection}
        onDelete={deleteSelectedPosts}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">{dictionary.scheduledCount}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{counts.scheduled}</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">{dictionary.publishedCount}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{counts.published}</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">{dictionary.processedCount}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{counts.processed}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label className="flex min-w-0 max-w-full items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={allDeletableSelected}
            onChange={toggleSelectAll}
            disabled={posts.length === 0}
            className="mt-0.5 shrink-0"
          />
          <span className="min-w-0 break-words">{dictionary.selectAll}</span>
        </label>
      </div>

      {feedback ? (
        <div
          className={
            feedback.type === "success"
              ? "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{dictionary.select}</th>
              <th className="px-4 py-3 font-medium">{dictionary.preview}</th>
              <th className="px-4 py-3 font-medium">{dictionary.caption}</th>
              <th className="px-4 py-3 font-medium">{generatorDictionary.postType}</th>
              <th className="px-4 py-3 font-medium">{dictionary.scheduledTime}</th>
              <th className="px-4 py-3 font-medium">{dictionary.publishedAt}</th>
              <th className="px-4 py-3 font-medium">{dictionary.status}</th>
              <th className="px-4 py-3 font-medium">{dictionary.fileStatus}</th>
              <th className="px-4 py-3 font-medium">{dictionary.editSchedule}</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const isEditable = post.status !== "PUBLISHED";
              const isSavingThisPost = savingPostId === post.id;

              return (
                <tr key={post.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPostIds.includes(post.id)}
                      onChange={() => toggleSelection(post.id)}
                      aria-label={dictionary.select}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <PreviewCell
                      imageUrl={post.imageUrl}
                      assetState={post.assetState}
                      alt={dictionary.previewAlt}
                      unavailableLabel={dictionary.previewUnavailable}
                    />
                  </td>
                  <td className="max-w-md px-4 py-4 text-slate-700">
                    <p className="line-clamp-4 whitespace-pre-wrap">{post.caption}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {getPostTypeLabel(post.postType, generatorDictionary)}
                  </td>
                  <td className="min-w-[220px] px-4 py-4 text-slate-600">
                    {isEditable ? (
                      <div className="space-y-2">
                        <input
                          type="datetime-local"
                          value={scheduleValues[post.id] ?? ""}
                          onChange={(event) =>
                            setScheduleValues((current) => ({
                              ...current,
                              [post.id]: event.target.value
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                        />
                        <p className="text-xs text-slate-400">
                          {formatDate(post.scheduledTime, locale)}
                        </p>
                      </div>
                    ) : (
                      formatDate(post.scheduledTime, locale)
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(post.publishedAt, locale)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {getStatusLabel(post.status, dictionary)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {getAssetLabel(post.assetState, dictionary)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {isEditable ? (
                      <button
                        type="button"
                        onClick={() => updateSchedule(post)}
                        disabled={isSavingThisPost}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
            })}
            {posts.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={9}>
                  {dictionary.noPosts}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/80 bg-white/80 px-5 py-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-ink">{dictionary.instagramFeedTitle}</h3>
          <p className="mt-1 text-sm text-slate-500">{dictionary.instagramFeedDescription}</p>
        </div>

        {instagramFeedError ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {dictionary.instagramFeedError}: {instagramFeedError}
          </div>
        ) : null}

        {instagramFeedItems.length === 0 && !instagramFeedError ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {dictionary.instagramFeedEmpty}
          </div>
        ) : null}

        {instagramFeedItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {instagramFeedItems.map((item) => {
              const previewUrl = item.thumbnailUrl || item.mediaUrl;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
                >
                  <div className="relative aspect-square bg-slate-100">
                    {previewUrl ? (
                      <Image
                        src={normalizePreviewSrc(previewUrl)}
                        alt={dictionary.previewAlt}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        {dictionary.previewUnavailable}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {item.mediaType}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(item.timestamp, locale)}
                      </span>
                    </div>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-700">
                      {item.caption || "-"}
                    </p>
                    {item.permalink ? (
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        {dictionary.openOnInstagram}
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
