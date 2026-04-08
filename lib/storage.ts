import { execFile as execFileCallback } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const AI_DIGITAL_SOURCE_TYPE =
  "https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

export async function saveUploadedImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${Date.now()}-${sanitizeFileName(file.name || "upload.png")}`;
  const absolutePath = path.join(uploadsDir, fileName);

  await writeFile(absolutePath, bytes);

  return {
    fileName,
    absolutePath,
    publicPath: `/uploads/${fileName}`
  };
}

export async function embedAiMetadata(absolutePath: string) {
  try {
    await execFile("exiftool", [
      "-overwrite_original",
      `-XMP-iptcExt:DigitalSourceType=${AI_DIGITAL_SOURCE_TYPE}`,
      "-XMP-dc:Creator=InstagramPost AI Publisher",
      "-XMP-xmp:CreatorTool=InstagramPost AI Publisher",
      absolutePath
    ]);
  } catch (error) {
    console.warn("[storage] Failed to embed AI metadata", {
      absolutePath,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function saveUploadedImageWithMetadata(
  file: File,
  options?: {
    markAsAiGenerated?: boolean;
  }
) {
  const upload = await saveUploadedImage(file);

  if (options?.markAsAiGenerated) {
    await embedAiMetadata(upload.absolutePath);
  }

  return upload;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
