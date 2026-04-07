"use client";

import { ChangeEvent, useState } from "react";

export function ImageUploader({
  onUploaded
}: {
  onUploaded: (payload: { imageUrl: string; imagePath: string }) => void;
}) {
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
      setError(json.error ?? "Upload failed.");
      return;
    }

    onUploaded({
      imageUrl: json.imageUrl,
      imagePath: json.imagePath
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-4">
      <p className="text-sm font-medium text-ink">Upload custom image</p>
      <p className="mt-1 text-sm text-slate-600">
        Uploading an image overrides the AI-generated preview for publishing.
      </p>
      <input type="file" accept="image/*" onChange={handleChange} className="mt-4 block text-sm" />
      {uploading ? <p className="mt-2 text-sm text-slate-500">Uploading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
