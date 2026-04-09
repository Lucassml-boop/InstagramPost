"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type ScheduledPostItem = {
  id: string;
  caption: string;
  imageUrl: string;
  postType: "FEED" | "STORY" | "CAROUSEL";
  status: "SCHEDULED" | "PUBLISHED" | "FAILED";
  scheduledTime: string | null;
  publishedAt: string | null;
  assetState: "available" | "deleted" | "remote";
};

type InstagramFeedItem = {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
};

type ScheduledPostsDictionary = {
  preview: string;
  caption: string;
  scheduledTime: string;
  publishedAt: string;
  status: string;
  fileStatus: string;
  scheduledStatus: string;
  publishedStatus: string;
  failedStatus: string;
  fileAvailable: string;
  fileDeleted: string;
  fileRemote: string;
  editSchedule: string;
  reschedule: string;
  saving: string;
  scheduledCount: string;
  publishedCount: string;
  processedCount: string;
  previewUnavailable: string;
  updatedSuccess: string;
  updateError: string;
  scheduleRequired: string;
  noPosts: string;
  previewAlt: string;
  select: string;
  selectAll: string;
  deleteSelected: string;
  deleting: string;
  clearSelection: string;
  deleteSuccess: string;
  deleteError: string;
  selectAtLeastOne: string;
  instagramFeedTitle: string;
  instagramFeedDescription: string;
  instagramFeedEmpty: string;
  instagramFeedError: string;
  openOnInstagram: string;
};

type GeneratorDictionary = {
  postType: string;
  postTypeFeed: string;
  postTypeStory: string;
  postTypeCarousel: string;
};

function normalizePreviewSrc(src: string) {
  if (!src) {
    return "";
  }

  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/")
  ) {
    return src;
  }

  return `/${src}`;
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(locale);
}

function getSelectionCountLabel(count: number, dictionary: ScheduledPostsDictionary) {
  return `${count} ${dictionary.select.toLowerCase()}`;
}

function getStatusLabel(
  status: ScheduledPostItem["status"],
  dictionary: ScheduledPostsDictionary
) {
  if (status === "PUBLISHED") {
    return dictionary.publishedStatus;
  }

  if (status === "FAILED") {
    return dictionary.failedStatus;
  }

  return dictionary.scheduledStatus;
}

function getAssetLabel(
  assetState: ScheduledPostItem["assetState"],
  dictionary: ScheduledPostsDictionary
) {
  if (assetState === "deleted") {
    return dictionary.fileDeleted;
  }

  if (assetState === "remote") {
    return dictionary.fileRemote;
  }

  return dictionary.fileAvailable;
}

function getPostTypeLabel(
  postType: ScheduledPostItem["postType"],
  dictionary: GeneratorDictionary
) {
  if (postType === "STORY") {
    return dictionary.postTypeStory;
  }

  if (postType === "CAROUSEL") {
    return dictionary.postTypeCarousel;
  }

  return dictionary.postTypeFeed;
}

function PreviewCell({
  imageUrl,
  assetState,
  alt,
  unavailableLabel
}: {
  imageUrl: string;
  assetState: ScheduledPostItem["assetState"];
  alt: string;
  unavailableLabel: string;
}) {
  const [hasError, setHasError] = useState(assetState === "deleted");
  const normalizedSrc = normalizePreviewSrc(imageUrl);

  useEffect(() => {
    setHasError(assetState === "deleted");
  }, [assetState, imageUrl]);

  if (hasError || !normalizedSrc) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
        {unavailableLabel}
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        className="object-cover"
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  );
}

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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>({});
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setScheduleValues(
      Object.fromEntries(posts.map((post) => [post.id, toDatetimeLocalValue(post.scheduledTime)]))
    );
  }, [posts]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setSelectedPostIds((current) => current.filter((postId) => posts.some((post) => post.id === postId)));
  }, [posts]);

  const counts = useMemo(
    () => ({
      scheduled: posts.filter((post) => post.status === "SCHEDULED").length,
      published: posts.filter((post) => post.status === "PUBLISHED").length,
      processed: posts.filter((post) => post.status !== "SCHEDULED").length
    }),
    [posts]
  );
  const deletablePosts = posts;
  const allDeletableSelected =
    deletablePosts.length > 0 &&
    deletablePosts.every((post) => selectedPostIds.includes(post.id));

  function toggleSelection(postId: string) {
    setSelectedPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  }

  function toggleSelectAll() {
    setSelectedPostIds((current) =>
      allDeletableSelected ? current.filter((id) => !deletablePosts.some((post) => post.id === id)) : deletablePosts.map((post) => post.id)
    );
  }

  function updateSchedule(post: ScheduledPostItem) {
    const value = scheduleValues[post.id];

    if (!value) {
      setFeedback({ type: "error", message: dictionary.scheduleRequired });
      return;
    }

    setSavingPostId(post.id);
    setFeedback(null);

    void (async () => {
      try {
        const response = await fetch("/api/posts/schedule", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            postId: post.id,
            caption: post.caption,
            scheduledTime: new Date(value).toISOString()
          })
        });

        const json = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(json.error ?? dictionary.updateError);
        }

        setFeedback({ type: "success", message: dictionary.updatedSuccess });
        startTransition(() => {
          router.refresh();
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : dictionary.updateError
        });
      } finally {
        setSavingPostId(null);
      }
    })();
  }

  function deleteSelectedPosts() {
    if (selectedPostIds.length === 0) {
      setFeedback({ type: "error", message: dictionary.selectAtLeastOne });
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    void (async () => {
      try {
        const response = await fetch("/api/posts/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            postIds: selectedPostIds
          })
        });

        const json = (await response.json()) as { error?: string; deletedCount?: number };

        if (!response.ok) {
          throw new Error(json.error ?? dictionary.deleteError);
        }

        setSelectedPostIds([]);
        setFeedback({ type: "success", message: dictionary.deleteSuccess });
        startTransition(() => {
          router.refresh();
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : dictionary.deleteError
        });
      } finally {
        setIsDeleting(false);
      }
    })();
  }

  return (
    <div className="space-y-6">
      {portalReady && selectedPostIds.length > 0
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
                <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                  {getSelectionCountLabel(selectedPostIds.length, dictionary)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPostIds([])}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {dictionary.clearSelection}
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedPosts}
                  disabled={isDeleting}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? dictionary.deleting : dictionary.deleteSelected}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

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
            disabled={deletablePosts.length === 0}
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
                <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
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
                      <span className="text-xs text-slate-400">{formatDate(item.timestamp, locale)}</span>
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
