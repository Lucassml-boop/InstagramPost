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
  getPublicationStateLabel,
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

      <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Deslize para o lado para ver todas as colunas.</span>
        </div>
        <table className="w-full min-w-[780px] text-left text-xs sm:min-w-[860px] sm:text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="w-10 px-2 py-2.5 font-medium sm:w-12 sm:px-3 sm:py-3">
                {dictionary.select}
              </th>
              <th className="w-20 px-2 py-2.5 font-medium sm:w-24 sm:px-3 sm:py-3">
                {dictionary.preview}
              </th>
              <th className="min-w-[180px] px-2 py-2.5 font-medium sm:min-w-[220px] sm:px-3 sm:py-3">
                {dictionary.caption}
              </th>
              <th className="w-24 px-2 py-2.5 font-medium sm:w-28 sm:px-3 sm:py-3">
                {generatorDictionary.postType}
              </th>
              <th className="min-w-[170px] px-2 py-2.5 font-medium sm:min-w-[200px] sm:px-3 sm:py-3">
                {dictionary.scheduledTime}
              </th>
              <th className="w-32 px-2 py-2.5 font-medium sm:w-36 sm:px-3 sm:py-3">
                {dictionary.publishedAt}
              </th>
              <th className="w-24 px-2 py-2.5 font-medium sm:w-28 sm:px-3 sm:py-3">
                {dictionary.status}
              </th>
              <th className="w-24 px-2 py-2.5 font-medium sm:w-28 sm:px-3 sm:py-3">
                {dictionary.fileStatus}
              </th>
              <th className="w-28 px-2 py-2.5 font-medium sm:w-32 sm:px-3 sm:py-3">
                {dictionary.editSchedule}
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const isEditable = post.status !== "PUBLISHED";
              const isSavingThisPost = savingPostId === post.id;
              const publicationStateLabel = getPublicationStateLabel(post.publicationState, dictionary);

              return (
                <tr key={post.id} className="border-t border-slate-100 align-top">
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                    <input
                      type="checkbox"
                      checked={selectedPostIds.includes(post.id)}
                      onChange={() => toggleSelection(post.id)}
                      aria-label={dictionary.select}
                    />
                  </td>
                  <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                    <PreviewCell
                      imageUrl={post.imageUrl}
                      assetState={post.assetState}
                      alt={dictionary.previewAlt}
                      unavailableLabel={dictionary.previewUnavailable}
                    />
                  </td>
                  <td className="max-w-[220px] px-2 py-2.5 text-slate-700 sm:max-w-[260px] sm:px-3 sm:py-3">
                    <p className="line-clamp-2 whitespace-pre-wrap break-words sm:line-clamp-3">
                      {post.caption}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-slate-600 sm:px-3 sm:py-3">
                    {getPostTypeLabel(post.postType, generatorDictionary)}
                  </td>
                  <td className="min-w-[170px] px-2 py-2.5 text-slate-600 sm:min-w-[200px] sm:px-3 sm:py-3">
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
                          className="w-full rounded-2xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-slate-400 sm:px-3 sm:text-sm"
                        />
                        <p className="text-xs text-slate-400">
                          {formatDate(post.scheduledTime, locale)}
                        </p>
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
                        onClick={() => updateSchedule(post)}
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
            })}
            {posts.length === 0 ? (
              <tr>
                <td className="px-2 py-10 text-center text-slate-500 sm:px-3" colSpan={9}>
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
