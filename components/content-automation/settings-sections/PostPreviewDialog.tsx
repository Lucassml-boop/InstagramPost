"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { parseBrandColors } from "@/components/create-post/utils";
import type { AppDictionary } from "./types";

function normalizePreviewSrc(src: string) {
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

function getSwatches(brandColors: string | null) {
  if (!brandColors) {
    return [];
  }

  const palette = parseBrandColors(brandColors);
  return [palette.primary, palette.background, palette.support, palette.accent].filter(Boolean);
}

export function PostPreviewDialog({
  dictionary,
  isOpen,
  onClose,
  title,
  caption,
  imageUrl,
  previewUrl,
  brandColors,
  postType
}: {
  dictionary: AppDictionary;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  caption: string | null;
  imageUrl: string | null;
  previewUrl: string | null;
  brandColors: string | null;
  postType: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  const resolvedPreviewUrl = previewUrl || imageUrl;
  const swatches = getSwatches(brandColors);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={dictionary.contentAutomation.closeQueueModal}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 grid w-full max-w-5xl gap-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="relative aspect-square bg-slate-100 lg:aspect-auto lg:min-h-[640px]">
          {resolvedPreviewUrl ? (
            <Image
              src={normalizePreviewSrc(resolvedPreviewUrl)}
              alt={title}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
              {dictionary.contentAutomation.previewUnavailable ?? "Preview indisponivel."}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {dictionary.contentAutomation.previewModalEyebrow ?? "Preview do post"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-ink">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              {dictionary.contentAutomation.closeQueueModal}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {dictionary.contentAutomation.nextPostCreationStatusLabel}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {dictionary.contentAutomation.nextPostCreationReady}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {dictionary.generator.postType}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">{postType ?? "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {dictionary.generator.brandColors}
            </p>
            {swatches.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {swatches.map((swatch) => (
                  <div key={swatch} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch }}
                    />
                    <span className="text-xs font-medium text-slate-700">{swatch}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">{dictionary.contentAutomation.noColorsSelected ?? "Nenhuma cor definida para este post."}</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {dictionary.common.caption}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {caption?.trim() || (dictionary.contentAutomation.previewCaptionFallback ?? "Legenda indisponivel.")}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
