import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/server-utils";
import { getPersistedPreviewUrl, saveUploadedImageWithMetadata } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const markAsAiGenerated = formData.get("markAsAiGenerated") === "true";

  if (!(file instanceof File)) {
    return jsonError("Image file is required.");
  }

  const upload = await saveUploadedImageWithMetadata(file, {
    markAsAiGenerated
  });

  return NextResponse.json({
    imageUrl: upload.publicPath,
    imagePath: upload.absolutePath,
    previewUrl: getPersistedPreviewUrl(upload.publicPath)
  });
}
