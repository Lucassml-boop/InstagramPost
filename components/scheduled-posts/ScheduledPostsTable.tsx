"use client";

import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { SelectionToolbar } from "./SelectionToolbar";
import { ScheduledPostsInstagramFeed } from "./ScheduledPostsInstagramFeed";
import { ScheduledPostsSummaryCards } from "./ScheduledPostsSummaryCards";
import { ScheduledPostTableRow } from "./ScheduledPostTableRow";
import type {
  GeneratorDictionary,
  InstagramFeedItem,
  ScheduledPostItem,
  ScheduledPostsDictionary
} from "./types";

export function ScheduledPostsTable({
  posts,
  instagramFeedItems,
  instagramFeedError,
  locale,
  dictionary,
  generatorDictionary,
  highlightPostId
}: {
  posts: ScheduledPostItem[];
  instagramFeedItems: InstagramFeedItem[];
  instagramFeedError: string | null;
  locale: string;
  dictionary: ScheduledPostsDictionary;
  generatorDictionary: GeneratorDictionary;
  highlightPostId?: string;
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

      <ScheduledPostsSummaryCards counts={counts} dictionary={dictionary} />

      {highlightPostId ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {dictionary.highlightedPost}
        </div>
      ) : null}

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
            {posts.map((post) => (
              <ScheduledPostTableRow
                key={post.id}
                post={post}
                locale={locale}
                dictionary={dictionary}
                generatorDictionary={generatorDictionary}
                highlightPostId={highlightPostId}
                selected={selectedPostIds.includes(post.id)}
                scheduleValue={scheduleValues[post.id] ?? ""}
                savingPostId={savingPostId}
                onToggle={() => toggleSelection(post.id)}
                onScheduleChange={(value) =>
                  setScheduleValues((current) => ({
                    ...current,
                    [post.id]: value
                  }))
                }
                onUpdateSchedule={() => updateSchedule(post)}
              />
            ))}
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

      <ScheduledPostsInstagramFeed
        instagramFeedItems={instagramFeedItems}
        instagramFeedError={instagramFeedError}
        locale={locale}
        dictionary={dictionary}
      />
    </div>
  );
}
