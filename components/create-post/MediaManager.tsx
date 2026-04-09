"use client";

import { ImageUploader } from "./ImageUploader";
import { getOptimizedAssetUrl } from "@/lib/storage";
import type { DraftResponse, MediaItem, PostType } from "./types";

export function MediaManager({
  draft,
  postType,
  uploadTitle,
  uploadDescription,
  removeLabel,
  carouselCountLabel,
  mediaLabel,
  carouselItemLabel,
  onDraftChange
}: {
  draft: DraftResponse;
  postType: PostType;
  uploadTitle: string;
  uploadDescription: string;
  removeLabel: string;
  carouselCountLabel: string;
  mediaLabel: string;
  carouselItemLabel: string;
  onDraftChange: (updater: (current: DraftResponse | null) => DraftResponse | null) => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-ink">{uploadTitle}</p>
      <p className="text-sm text-slate-600">{uploadDescription}</p>

      {draft.mediaItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.mediaItems.map((item, index) => (
            <div
              key={`${item.imagePath}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={
                    item.previewUrl ||
                    getOptimizedAssetUrl(item.imageUrl, {
                      width: 320,
                      height: 320,
                      quality: 72,
                      resize: "cover"
                    })
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {postType === "carousel" ? `${carouselItemLabel} ${index + 1}` : mediaLabel}
                </p>
                <button
                  type="button"
                  disabled={draft.mediaItems.length === 1}
                  onClick={() =>
                    onDraftChange((current) => {
                      if (!current) {
                        return current;
                      }

                      const nextItems = current.mediaItems.filter(
                        (_, itemIndex) => itemIndex !== index
                      );

                      if (nextItems.length === 0) {
                        return current;
                      }

                      return {
                        ...current,
                        mediaItems: nextItems,
                        imageUrl: nextItems[0].imageUrl,
                        imagePath: nextItems[0].imagePath
                      };
                    })
                  }
                  className="text-sm font-semibold text-slate-600 transition hover:text-ink disabled:opacity-40"
                >
                  {removeLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ImageUploader
        multiple={postType === "carousel"}
        maxFiles={postType === "carousel" ? Math.max(0, 10 - draft.mediaItems.length) : 1}
        showText={false}
        allowAiToggle
        onUploaded={(items) =>
          onDraftChange((current) => {
            if (!current || items.length === 0) {
              return current;
            }

            const nextItems: MediaItem[] =
              postType === "carousel"
                ? [...current.mediaItems, ...items].slice(0, 10)
                : items.slice(0, 1);

            return {
              ...current,
              mediaItems: nextItems,
              imageUrl: nextItems[0].imageUrl,
              imagePath: nextItems[0].imagePath
            };
          })
        }
      />

      {postType === "carousel" ? (
        <p className="text-sm text-slate-600">
          {carouselCountLabel}: {draft.mediaItems.length}/10
        </p>
      ) : null}
    </div>
  );
}
