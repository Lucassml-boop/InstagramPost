"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { normalizePreviewSrc } from "./utils";
import type { ScheduledPostItem } from "./types";

export function PreviewCell({
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
