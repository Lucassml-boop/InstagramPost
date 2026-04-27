import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cache } from "react";
import { z } from "zod";
import {
  AGENDA_PATH,
  BRAND_PROFILE_PATH,
  CONTENT_HISTORY_PATH,
  CONTENT_SYSTEM_DIR,
  TOPICS_PATH,
  TOPICS_HISTORY_PATH
} from "./content-system.constants.ts";
import {
  brandProfileSchema,
  historyItemSchema,
  topicHistoryRecordSchema,
  type ContentPlanItem,
  type HistoryItem,
  type TopicHistoryRecord
} from "./content-system.schemas.ts";
import { normalizeTopicHistoryRecord } from "./content-system-utils.ts";
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

function isMissingContentStorageTableError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("ContentBrandProfile") ||
      error.message.includes("ContentWeeklyAgenda") ||
      error.message.includes("ContentTopicsHistory") ||
      error.message.includes("ContentHistory")) &&
    error.message.includes("does not exist")
  );
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function readUserJsonRecord<T>(
  userId: string | undefined,
  delegateName: "contentBrandProfile" | "contentWeeklyAgenda" | "contentTopicsHistory" | "contentHistory",
  fieldName: "data" | "agenda" | "records" | "items",
  fallback: T
) {
  if (!userId) {
    return fallback;
  }

  try {
    const prisma = await getPrisma();
    const delegate = (prisma as unknown as Record<string, {
      findUnique: (input: { where: { userId: string } }) => Promise<Record<string, unknown> | null>;
    }>)[delegateName];
    const record = await delegate.findUnique({ where: { userId } });
    return (record?.[fieldName] ?? fallback) as T;
  } catch (error) {
    if (isMissingContentStorageTableError(error)) {
      return fallback;
    }

    throw error;
  }
}

async function upsertUserJsonRecord(
  userId: string | undefined,
  delegateName: "contentBrandProfile" | "contentWeeklyAgenda" | "contentTopicsHistory" | "contentHistory",
  fieldName: "data" | "agenda" | "records" | "items",
  value: unknown,
  extraFields?: Record<string, unknown>
) {
  if (!userId) {
    return false;
  }

  try {
    const prisma = await getPrisma();
    const delegate = (prisma as unknown as Record<string, {
      upsert: (input: {
        where: { userId: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => Promise<unknown>;
    }>)[delegateName];
    await delegate.upsert({
      where: { userId },
      create: {
        userId,
        [fieldName]: value,
        ...(extraFields ?? {})
      },
      update: {
        [fieldName]: value,
        ...(extraFields ?? {})
      }
    });
    return true;
  } catch (error) {
    if (isMissingContentStorageTableError(error)) {
      return false;
    }

    throw error;
  }
}

export async function getBrandProfile(userId?: string) {
  const dbProfile = await readUserJsonRecord<unknown>(
    userId,
    "contentBrandProfile",
    "data",
    null
  );

  if (dbProfile) {
    return brandProfileSchema.parse(dbProfile);
  }

  const raw = await readJsonFile<unknown>(BRAND_PROFILE_PATH, {});
  return brandProfileSchema.parse(raw);
}

export const getContentBrandProfile = cache(async (userId?: string) => getBrandProfile(userId));

export async function getContentHistory(userId?: string) {
  const dbItems = await readUserJsonRecord<unknown[] | null>(
    userId,
    "contentHistory",
    "items",
    null
  );
  if (dbItems) {
    return z.array(historyItemSchema).parse(dbItems);
  }

  const raw = await readJsonFile<unknown>(CONTENT_HISTORY_PATH, []);
  return z.array(historyItemSchema).parse(raw);
}

export async function getTopicsHistoryRecords(userId?: string) {
  const dbRecords = await readUserJsonRecord<unknown[] | null>(
    userId,
    "contentTopicsHistory",
    "records",
    null
  );
  if (dbRecords) {
    return z
      .array(z.union([z.string(), topicHistoryRecordSchema.partial()]))
      .parse(dbRecords)
      .map((entry) => normalizeTopicHistoryRecord(entry))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }

  const raw = await readJsonFile<unknown>(TOPICS_HISTORY_PATH, []);
  return z
    .array(z.union([z.string(), topicHistoryRecordSchema.partial()]))
    .parse(raw)
    .map((entry) => normalizeTopicHistoryRecord(entry))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export async function getTopicsHistory(userId?: string) {
  const records = await getTopicsHistoryRecords(userId);
  return records.map((entry) => entry.theme);
}

export const getCurrentWeeklyAgenda = cache(async (userId?: string) => {
  const dbAgenda = await readUserJsonRecord<unknown[] | null>(
    userId,
    "contentWeeklyAgenda",
    "agenda",
    null
  );
  if (dbAgenda) {
    return normalizeStoredAgenda(dbAgenda) as ContentPlanItem[];
  }

  const agenda = await readJsonFile<unknown[]>(AGENDA_PATH, []);
  return normalizeStoredAgenda(agenda) as ContentPlanItem[];
});

export const getContentTopicsHistory = cache(async (userId?: string) => getTopicsHistory(userId));

export async function updateContentBrandProfile(input: unknown, userId?: string) {
  const parsed = brandProfileSchema.parse(input);
  const savedToDatabase = await upsertUserJsonRecord(
    userId,
    "contentBrandProfile",
    "data",
    parsed
  );

  if (savedToDatabase) {
    return parsed;
  }

  await writeJsonFile(BRAND_PROFILE_PATH, parsed);
  return parsed;
}

export async function clearTopicsHistory(userId?: string) {
  const current = await getTopicsHistory(userId);
  const savedToDatabase = await upsertUserJsonRecord(
    userId,
    "contentTopicsHistory",
    "records",
    []
  );

  if (savedToDatabase) {
    return {
      clearedEntries: current.length
    };
  }

  await writeJsonFile(TOPICS_HISTORY_PATH, []);
  return {
    clearedEntries: current.length
  };
}

export async function clearCurrentWeeklyAgenda(userId?: string) {
  const current = await getCurrentWeeklyAgenda(userId);
  const savedToDatabase = await upsertUserJsonRecord(
    userId,
    "contentWeeklyAgenda",
    "agenda",
    [],
    { currentTopics: [] }
  );

  if (savedToDatabase) {
    return {
      clearedEntries: current.length
    };
  }

  await writeJsonFile(AGENDA_PATH, []);
  return {
    clearedEntries: current.length
  };
}

export async function saveCurrentTopics(topics: string[], userId?: string) {
  const savedToDatabase = await upsertUserJsonRecord(
    userId,
    "contentWeeklyAgenda",
    "agenda",
    await getCurrentWeeklyAgenda(userId),
    { currentTopics: topics }
  );

  if (!savedToDatabase) {
    await writeJsonFile(TOPICS_PATH, topics);
  }
}

export async function saveWeeklyContentResult(input: {
  userId?: string;
  agenda: ContentPlanItem[];
  contentHistory: HistoryItem[];
  topicHistoryRecords: TopicHistoryRecord[];
  currentTopics: string[];
}) {
  const [agendaSaved, contentHistorySaved, topicsHistorySaved] = await Promise.all([
    upsertUserJsonRecord(
      input.userId,
      "contentWeeklyAgenda",
      "agenda",
      input.agenda,
      { currentTopics: input.currentTopics }
    ),
    upsertUserJsonRecord(input.userId, "contentHistory", "items", input.contentHistory),
    upsertUserJsonRecord(
      input.userId,
      "contentTopicsHistory",
      "records",
      input.topicHistoryRecords
    )
  ]);

  if (agendaSaved && contentHistorySaved && topicsHistorySaved) {
    return;
  }

  await Promise.all([
    writeJsonFile(AGENDA_PATH, input.agenda),
    writeJsonFile(CONTENT_HISTORY_PATH, input.contentHistory),
    writeJsonFile(TOPICS_HISTORY_PATH, input.topicHistoryRecords),
    writeJsonFile(TOPICS_PATH, input.currentTopics)
  ]);
}
