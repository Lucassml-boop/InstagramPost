import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cache } from "react";
import { z } from "zod";
import {
  AGENDA_PATH,
  BRAND_PROFILE_PATH,
  CONTENT_HISTORY_PATH,
  CONTENT_SYSTEM_DIR,
  TOPICS_HISTORY_PATH
} from "./content-system.constants.ts";
import {
  brandProfileSchema,
  historyItemSchema,
  type ContentPlanItem
} from "./content-system.schemas.ts";
import { normalizeStoredAgenda } from "./content-system.schedule.ts";

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

export async function getBrandProfile() {
  const raw = await readJsonFile<unknown>(BRAND_PROFILE_PATH, {});
  return brandProfileSchema.parse(raw);
}

export const getContentBrandProfile = cache(async () => getBrandProfile());

export async function getContentHistory() {
  const raw = await readJsonFile<unknown>(CONTENT_HISTORY_PATH, []);
  return z.array(historyItemSchema).parse(raw);
}

export async function getTopicsHistory() {
  const raw = await readJsonFile<unknown>(TOPICS_HISTORY_PATH, []);
  return z.array(z.string()).parse(raw);
}

export const getCurrentWeeklyAgenda = cache(async () => {
  const agenda = await readJsonFile<unknown[]>(AGENDA_PATH, []);
  return normalizeStoredAgenda(agenda) as ContentPlanItem[];
});

export const getContentTopicsHistory = cache(async () => getTopicsHistory());

export async function updateContentBrandProfile(input: unknown) {
  const parsed = brandProfileSchema.parse(input);
  await writeJsonFile(BRAND_PROFILE_PATH, parsed);
  return parsed;
}

export async function clearTopicsHistory() {
  const current = await getTopicsHistory();
  await writeJsonFile(TOPICS_HISTORY_PATH, []);
  return {
    clearedEntries: current.length
  };
}
