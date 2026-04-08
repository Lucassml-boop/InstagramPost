"use client";

import { ChangeEvent, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

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
  onUploaded: (payload: { imageUrl: string; imagePath: string }[]) => void;
}) {
  const { dictionary } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markAsAiGenerated, setMarkAsAiGenerated] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const limitedFiles = typeof maxFiles === "number" ? files.slice(0, maxFiles) : files;
      const uploadedItems: { imageUrl: string; imagePath: string }[] = [];

      for (const file of limitedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("markAsAiGenerated", String(markAsAiGenerated));

        const response = await fetch("/api/posts/upload-image", {
          method: "POST",
          body: formData
        });

        const json = (await response.json()) as {
          error?: string;
          imageUrl?: string;
          imagePath?: string;
        };

        if (!response.ok || !json.imageUrl || !json.imagePath) {
          setError(json.error ?? dictionary.upload.error);
          return;
        }

        uploadedItems.push({
          imageUrl: json.imageUrl,
          imagePath: json.imagePath
        });
      }

      onUploaded(uploadedItems);
    } catch (error) {
      setError(
        error instanceof TypeError && error.message === "Failed to fetch"
          ? dictionary.common.serverConnectionError
          : error instanceof Error
            ? error.message
            : dictionary.upload.error
      );
    } finally {
      setUploading(false);
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
      {uploading ? <p className="mt-2 text-sm text-slate-500">{dictionary.upload.uploading}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
