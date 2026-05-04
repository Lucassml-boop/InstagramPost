"use client";

import Image from "next/image";
import type { InstagramFeedItem, ScheduledPostsDictionary } from "./types";
import { formatDate, normalizePreviewSrc } from "./utils";

export function ScheduledPostsInstagramFeed({
  instagramFeedItems,
  instagramFeedError,
  locale,
  dictionary
}: {
  instagramFeedItems: InstagramFeedItem[];
  instagramFeedError: string | null;
  locale: string;
  dictionary: ScheduledPostsDictionary;
}) {
  return (
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
  );
}
