import { mkdir, readFile, writeFile } from "node:fs/promises";
import { CONTENT_SYSTEM_DIR } from "./content-system.constants.ts";

export async function ensureContentSystemDir() {
  await mkdir(CONTENT_SYSTEM_DIR, { recursive: true });
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await ensureContentSystemDir();
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
