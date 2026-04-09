"use client";

import { ChangeEvent, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import { uploadImage } from "@/services/frontend/posts";

export function ImageUploader({
  multiple = false,
  maxFiles,
  showText = true,
  allowAiToggle = false,
  onUploaded
}: {
  multiple?: boolean;
  maxFiles?: number;
  showText?: boolean;
  allowAiToggle?: boolean;
  onUploaded: (payload: { imageUrl: string; imagePath: string; previewUrl?: string }[]) => void;
}) {
  const { dictionary } = useI18n();
  const [markAsAiGenerated, setMarkAsAiGenerated] = useState(false);
  const uploadAction = useAsyncAction();

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    uploadAction.setError(null);

    try {
      const uploadedItems = await uploadAction.run(async () => {
        const limitedFiles = typeof maxFiles === "number" ? files.slice(0, maxFiles) : files;
        const nextItems: { imageUrl: string; imagePath: string; previewUrl?: string }[] = [];

        for (const file of limitedFiles) {
          const json = await uploadImage(file, markAsAiGenerated);

          if (!json.imageUrl || !json.imagePath) {
            throw new Error(dictionary.upload.error);
          }

          nextItems.push({
            imageUrl: json.imageUrl,
            imagePath: json.imagePath,
            ...(json.previewUrl ? { previewUrl: json.previewUrl } : {})
          });
        }

        return nextItems;
      });

      onUploaded(uploadedItems);
    } catch (error) {
      uploadAction.setError(
        getClientRequestErrorMessage(
          error,
          dictionary.upload.error,
          dictionary.common.serverConnectionError
        )
      );
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-4">
      {showText ? (
        <>
          <p className="text-sm font-medium text-ink">{dictionary.upload.title}</p>
          <p className="mt-1 text-sm text-slate-600">{dictionary.upload.description}</p>
        </>
      ) : null}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        className={`${showText ? "mt-4" : ""} block text-sm`}
      />
      {allowAiToggle ? (
        <label className="mt-3 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={markAsAiGenerated}
            onChange={(event) => setMarkAsAiGenerated(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">{dictionary.upload.markAsAiGenerated}</span>
            <span className="mt-1 block text-slate-600">
              {dictionary.upload.markAsAiGeneratedDescription}
            </span>
          </span>
        </label>
      ) : null}
      {uploadAction.isLoading ? (
        <p className="mt-2 text-sm text-slate-500">{dictionary.upload.uploading}</p>
      ) : null}
      {uploadAction.error ? <p className="mt-2 text-sm text-red-600">{uploadAction.error}</p> : null}
    </div>
  );
}
