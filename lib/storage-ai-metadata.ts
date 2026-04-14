import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { AI_DIGITAL_SOURCE_TYPE, sanitizeFileName } from "@/lib/storage.server.config";

const execFile = promisify(execFileCallback);
const AI_CREATOR_NAME = "InstagramPost AI Publisher";
const AI_DESCRIPTION = "AI-generated image";

type AiMetadataInspectionResult = {
  exiftoolAvailable: boolean;
  digitalSourceType: string | null;
  creator: string | null;
  creatorTool: string | null;
  description: string | null;
  credit: string | null;
  rights: string | null;
  rawOutput: Record<string, unknown> | null;
};

export async function applyAiMetadataToBuffer(buffer: Buffer, fileName: string) {
  let tempDir = "";

  try {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "instagram-post-ai-"));
    const tempFilePath = path.join(tempDir, sanitizeFileName(fileName));

    await writeFile(tempFilePath, buffer);
    await execFile("exiftool", [
      "-overwrite_original",
      "-m",
      `-XMP-iptcExt:DigitalSourceType=${AI_DIGITAL_SOURCE_TYPE}`,
      `-XMP-dc:Creator=${AI_CREATOR_NAME}`,
      `-XMP-xmp:CreatorTool=${AI_CREATOR_NAME}`,
      `-XMP-dc:Description=${AI_DESCRIPTION}`,
      `-XMP-photoshop:Credit=${AI_CREATOR_NAME}`,
      `-XMP-dc:Rights=${AI_CREATOR_NAME}`,
      tempFilePath
    ]);

    console.info("[storage] Embedded AI metadata into asset buffer", {
      fileName,
      digitalSourceType: AI_DIGITAL_SOURCE_TYPE
    });

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

export async function inspectAiMetadataInBuffer(
  buffer: Buffer,
  fileName: string
): Promise<AiMetadataInspectionResult> {
  let tempDir = "";

  try {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "instagram-post-ai-inspect-"));
    const tempFilePath = path.join(tempDir, sanitizeFileName(fileName));

    await writeFile(tempFilePath, buffer);

    const { stdout } = await execFile("exiftool", ["-j", "-XMP:All", tempFilePath]);
    const [parsed] = JSON.parse(stdout) as Array<Record<string, unknown>>;

    return {
      exiftoolAvailable: true,
      digitalSourceType:
        typeof parsed?.DigitalSourceType === "string" ? parsed.DigitalSourceType : null,
      creator: typeof parsed?.Creator === "string" ? parsed.Creator : null,
      creatorTool: typeof parsed?.CreatorTool === "string" ? parsed.CreatorTool : null,
      description: typeof parsed?.Description === "string" ? parsed.Description : null,
      credit: typeof parsed?.Credit === "string" ? parsed.Credit : null,
      rights: typeof parsed?.Rights === "string" ? parsed.Rights : null,
      rawOutput: parsed ?? null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("spawn exiftool ENOENT")) {
      return {
        exiftoolAvailable: false,
        digitalSourceType: null,
        creator: null,
        creatorTool: null,
        description: null,
        credit: null,
        rights: null,
        rawOutput: null
      };
    }

    throw error;
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
