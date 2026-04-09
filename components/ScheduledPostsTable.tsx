"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  locale,
  dictionary,
  generatorDictionary
}: {
  posts: ScheduledPostItem[];
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

  useEffect(() => {
    setScheduleValues(
      Object.fromEntries(posts.map((post) => [post.id, toDatetimeLocalValue(post.scheduledTime)]))
    );
  }, [posts]);

  const counts = useMemo(
    () => ({
      scheduled: posts.filter((post) => post.status === "SCHEDULED").length,
      published: posts.filter((post) => post.status === "PUBLISHED").length,
      processed: posts.filter((post) => post.status !== "SCHEDULED").length
    }),
    [posts]
  );

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

  return (
    <div className="space-y-6">
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
                <td className="px-4 py-10 text-center text-slate-500" colSpan={8}>
                  {dictionary.noPosts}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
