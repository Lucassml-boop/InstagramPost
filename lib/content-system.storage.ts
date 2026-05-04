import { cache } from "react";
import { z } from "zod";
import { AGENDA_PATH, BRAND_PROFILE_PATH, CONTENT_HISTORY_PATH, TOPICS_PATH, TOPICS_HISTORY_PATH } from "./content-system.constants.ts";
import {
  brandProfileSchema,
  historyItemSchema,
  type ContentPlanItem,
  type HistoryItem,
  type TopicHistoryRecord
} from "./content-system.schemas.ts";
import { readUserJsonRecord, upsertUserJsonRecord } from "./content-system.storage-db.ts";
import { readJsonFile, writeJsonFile } from "./content-system.storage-files.ts";
import { parseTopicHistoryRecords } from "./content-system.storage-parsers.ts";
import { normalizeStoredAgenda } from "./content-system.schedule.ts";

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
    return parseTopicHistoryRecords(dbRecords);
  }

  const raw = await readJsonFile<unknown>(TOPICS_HISTORY_PATH, []);
  return parseTopicHistoryRecords(raw);
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
