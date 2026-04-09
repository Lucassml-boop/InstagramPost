import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const AI_DIGITAL_SOURCE_TYPE =
  "https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia";
const DEFAULT_STORAGE_BUCKET = "instagram-post-media";
const GENERATED_POSTS_DIR = "generated-posts";
const UPLOADS_DIR = "uploads";

type StoredAsset = {
  fileName: string;
  absolutePath: string;
  publicPath: string;
  storagePath: string;
  provider: "local" | "supabase";
};

export function isRemoteAssetUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function isRemoteAssetPath(value: string) {
  return value.startsWith("supabase://") || isRemoteAssetUrl(value);
}

type AssetTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

function buildSupabaseTransformedUrl(publicUrl: string, options: AssetTransformOptions) {
  try {
    const url = new URL(publicUrl);

    if (!url.pathname.startsWith("/storage/v1/object/public/")) {
      return null;
    }

    url.pathname = url.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );

    if (options.width) {
      url.searchParams.set("width", String(options.width));
    }

    if (options.height) {
      url.searchParams.set("height", String(options.height));
    }

    if (options.quality) {
      url.searchParams.set("quality", String(options.quality));
    }

    if (options.resize) {
      url.searchParams.set("resize", options.resize);
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function getOptimizedAssetUrl(publicUrl: string, options: AssetTransformOptions = {}) {
  if (!publicUrl) {
    return publicUrl;
  }

  return buildSupabaseTransformedUrl(publicUrl, options) ?? publicUrl;
}

export function getPersistedPreviewUrl(publicUrl: string) {
  return getOptimizedAssetUrl(publicUrl, {
    width: 320,
    height: 320,
    quality: 72,
    resize: "cover"
  });
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

function getSupabaseStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl: normalizeSupabaseUrl(supabaseUrl),
    serviceRoleKey,
    bucket
  };
}

export function isDurableStorageConfigured() {
  return Boolean(getSupabaseStorageConfig());
}

async function applyAiMetadataToBuffer(buffer: Buffer, fileName: string) {
  let tempDir = "";

  try {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "instagram-post-ai-"));
    const tempFilePath = path.join(tempDir, sanitizeFileName(fileName));

    await writeFile(tempFilePath, buffer);
    await execFile("exiftool", [
      "-overwrite_original",
      `-XMP-iptcExt:DigitalSourceType=${AI_DIGITAL_SOURCE_TYPE}`,
      "-XMP-dc:Creator=InstagramPost AI Publisher",
      "-XMP-xmp:CreatorTool=InstagramPost AI Publisher",
      tempFilePath
    ]);

    return await readFile(tempFilePath);
  } catch (error) {
    console.warn("[storage] Failed to embed AI metadata into asset buffer", {
      fileName,
      error: error instanceof Error ? error.message : String(error)
    });

    return buffer;
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

async function uploadToSupabaseStorage(input: {
  bytes: Buffer;
  fileName: string;
  storagePath: string;
  contentType: string;
}) {
  const config = getSupabaseStorageConfig();

  if (!config) {
    throw new Error("Supabase Storage is not configured.");
  }

  const uploadUrl = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(
    config.bucket
  )}/${input.storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      "Content-Type": input.contentType,
      "x-upsert": "true"
    },
    body: new Uint8Array(input.bytes)
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Failed to upload asset to Supabase Storage (${response.status}): ${errorText || "unknown error"}`
    );
  }

  return {
    fileName: input.fileName,
    absolutePath: `supabase://${config.bucket}/${input.storagePath}`,
    publicPath: `${config.supabaseUrl}/storage/v1/object/public/${config.bucket}/${input.storagePath}`,
    storagePath: input.storagePath,
    provider: "supabase" as const
  };
}

async function saveToLocalDisk(input: {
  bytes: Buffer;
  fileName: string;
  storagePath: string;
}) {
  const absolutePath = path.join(process.cwd(), "public", input.storagePath);
  const parentDir = path.dirname(absolutePath);

  await mkdir(parentDir, { recursive: true });
  await writeFile(absolutePath, input.bytes);

  return {
    fileName: input.fileName,
    absolutePath,
    publicPath: `/${input.storagePath}`,
    storagePath: input.storagePath,
    provider: "local" as const
  };
}

async function saveAsset(input: {
  bytes: Buffer;
  fileName: string;
  folder: string;
  contentType: string;
}) {
  const storagePath = `${input.folder}/${input.fileName}`;

  if (getSupabaseStorageConfig()) {
    return uploadToSupabaseStorage({
      bytes: input.bytes,
      fileName: input.fileName,
      storagePath,
      contentType: input.contentType
    });
  }

  return saveToLocalDisk({
    bytes: input.bytes,
    fileName: input.fileName,
    storagePath
  });
}

export async function saveUploadedImage(file: File) {
  const originalName = file.name || "upload.png";
  const bytes = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${sanitizeFileName(originalName)}`;

  return saveAsset({
    bytes,
    fileName,
    folder: UPLOADS_DIR,
    contentType: file.type || "application/octet-stream"
  });
}

export async function saveUploadedImageWithMetadata(
  file: File,
  options?: {
    markAsAiGenerated?: boolean;
  }
) {
  const originalName = file.name || "upload.png";
  const initialBytes = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${sanitizeFileName(originalName)}`;
  const bytes = options?.markAsAiGenerated
    ? await applyAiMetadataToBuffer(initialBytes, fileName)
    : initialBytes;

  return saveAsset({
    bytes,
    fileName,
    folder: UPLOADS_DIR,
    contentType: file.type || "application/octet-stream"
  });
}

export async function saveGeneratedImageBuffer(input: {
  bytes: Buffer;
  slug: string;
  markAsAiGenerated?: boolean;
}) {
  const fileName = `${Date.now()}-${sanitizeFileName(input.slug)}.jpg`;
  const bytes = input.markAsAiGenerated
    ? await applyAiMetadataToBuffer(input.bytes, fileName)
    : input.bytes;

  return saveAsset({
    bytes,
    fileName,
    folder: GENERATED_POSTS_DIR,
    contentType: "image/jpeg"
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export type { StoredAsset };
