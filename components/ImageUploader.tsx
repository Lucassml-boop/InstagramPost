"use client";

import { ChangeEvent, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

export function ImageUploader({
  onUploaded
}: {
  onUploaded: (payload: { imageUrl: string; imagePath: string }) => void;
}) {
  const { dictionary } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/posts/upload-image", {
      method: "POST",
      body: formData
    });

    const json = (await response.json()) as {
      error?: string;
      imageUrl?: string;
      imagePath?: string;
    };

    setUploading(false);

    if (!response.ok || !json.imageUrl || !json.imagePath) {
      setError(json.error ?? dictionary.upload.error);
      return;
    }

    onUploaded({
      imageUrl: json.imageUrl,
      imagePath: json.imagePath
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-4">
      <p className="text-sm font-medium text-ink">{dictionary.upload.title}</p>
      <p className="mt-1 text-sm text-slate-600">{dictionary.upload.description}</p>
      <input type="file" accept="image/*" onChange={handleChange} className="mt-4 block text-sm" />
      {uploading ? <p className="mt-2 text-sm text-slate-500">{dictionary.upload.uploading}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
