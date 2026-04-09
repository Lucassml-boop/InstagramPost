"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/shared";

export function PostLayoutPreview({
  imageUrl,
  mediaItems = [],
  caption,
  postType,
  mediaCount,
  showCaption = true
}: {
  imageUrl: string | null;
  mediaItems?: { imageUrl: string; imagePath: string }[];
  caption: string;
  postType: "feed" | "story" | "carousel";
  mediaCount: number;
  showCaption?: boolean;
}) {
  const { dictionary } = useI18n();
  const previewClassName =
    postType === "story"
      ? "relative mx-auto aspect-[9/16] w-full max-w-[320px]"
      : "relative aspect-square w-full";
  const [currentIndex, setCurrentIndex] = useState(0);
  const resolvedMediaItems =
    mediaItems.length > 0 ? mediaItems : imageUrl ? [{ imageUrl, imagePath: imageUrl }] : [];
  const currentImageUrl = resolvedMediaItems[currentIndex]?.imageUrl ?? imageUrl;

  useEffect(() => {
    setCurrentIndex(0);
  }, [postType, resolvedMediaItems.length, imageUrl]);

  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {dictionary.common.preview}
      </p>
      <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        {currentImageUrl ? (
          <div className={previewClassName}>
            <Image
              src={currentImageUrl}
              alt={dictionary.preview.imageAlt}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center bg-slate-100 text-sm text-slate-500 ${
              postType === "story"
                ? "mx-auto aspect-[9/16] w-full max-w-[320px]"
                : "aspect-square"
            }`}
          >
            {dictionary.preview.empty}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <span className="rounded-full bg-slate-100 px-3 py-1">
          {postType === "feed"
            ? dictionary.generator.postTypeFeed
            : postType === "story"
              ? dictionary.generator.postTypeStory
              : dictionary.generator.postTypeCarousel}
        </span>
        {postType === "carousel" ? (
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {dictionary.generator.carouselCount}: {mediaCount}
          </span>
        ) : null}
      </div>
      {postType === "carousel" && resolvedMediaItems.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            disabled={currentIndex === 0}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-40"
          >
            {dictionary.preview.previous}
          </button>
          <p className="text-sm text-slate-600">
            {currentIndex + 1} / {resolvedMediaItems.length}
          </p>
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((index) => Math.min(resolvedMediaItems.length - 1, index + 1))
            }
            disabled={currentIndex >= resolvedMediaItems.length - 1}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-40"
          >
            {dictionary.preview.next}
          </button>
        </div>
      ) : null}
      {showCaption ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-ink">{dictionary.common.caption}</p>
          <p className="mt-2 whitespace-pre-wrap">{caption || dictionary.preview.noCaption}</p>
        </div>
      ) : null}
    </Panel>
  );
}
