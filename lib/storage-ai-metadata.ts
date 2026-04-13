import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { AI_DIGITAL_SOURCE_TYPE, sanitizeFileName } from "@/lib/storage.server.config";

const execFile = promisify(execFileCallback);

export async function applyAiMetadataToBuffer(buffer: Buffer, fileName: string) {
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
