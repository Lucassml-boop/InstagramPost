"use client";

import Image from "next/image";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/ui";

export function PostLayoutPreview({
  imageUrl,
  caption
}: {
  imageUrl: string | null;
  caption: string;
}) {
  const { dictionary } = useI18n();

  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {dictionary.common.preview}
      </p>
      <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        {imageUrl ? (
          <div className="relative aspect-square w-full">
            <Image src={imageUrl} alt={dictionary.preview.imageAlt} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
            {dictionary.preview.empty}
          </div>
        )}
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-ink">{dictionary.common.caption}</p>
        <p className="mt-2 whitespace-pre-wrap">{caption || dictionary.preview.noCaption}</p>
      </div>
    </Panel>
  );
}
