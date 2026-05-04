import {
  throwIfGenerationCancelled
} from "@/lib/content-system.generation-progress";
import {
  buildTopicHistoryRecords,
  buildTopicsHistoryEntries,
  enrichContentPlanItem,
  shouldBlockForHistoryDuplicate,
  shouldBlockForInternalDuplicate
} from "@/lib/content-system-utils";
import { buildWeekSlots, type WeekSlot } from "./content-system.schedule.ts";
import {
  fetchCurrentTopics,
  requestPromptedWeeklyAgenda
} from "./content-system.weekly-plan-prompt.ts";
import type { TopicHistoryRecord } from "./content-system.schemas.ts";
import {
  getBrandProfile,
  getContentHistory,
  getTopicsHistoryRecords,
  saveWeeklyContentResult
} from "./content-system.storage.ts";

const MAX_WEEKLY_AGENDA_ATTEMPTS = 5;
const MAX_REJECTED_THEMES_IN_PROMPT = 24;
const MAX_TOPIC_HISTORY_RECORDS = 300;

function buildAgendaWithWeekSlots(
  generatedAgenda: Awaited<ReturnType<typeof requestPromptedWeeklyAgenda>>,
  weekSlots: WeekSlot[]
) {
  return generatedAgenda.map((item, index) =>
    enrichContentPlanItem({
      ...item,
      date: weekSlots[index]?.date ?? item.date,
      day: weekSlots[index]?.label ?? item.day,
      time: weekSlots[index]?.time ?? item.time
    })
  );
}

function mergeTopicHistoryRecords(
  existingRecords: TopicHistoryRecord[],
  newRecords: TopicHistoryRecord[]
) {
  const merged = new Map<string, TopicHistoryRecord>();

  for (const record of [...existingRecords, ...newRecords]) {
    merged.set(record.fingerprint, record);
  }

  return Array.from(merged.values()).slice(-MAX_TOPIC_HISTORY_RECORDS);
}

function buildRecentHistoryWindow(
  topicHistoryRecords: TopicHistoryRecord[],
  historyLookbackDays: number,
  attempt: number
) {
  const baseLookback = Math.ceil((historyLookbackDays || 60) * 7 / 30);
  const historyWindow = Math.max(
    Math.ceil(baseLookback * (1 - (attempt - 1) * 0.2)),
    7
  );

  return {
    historyWindow,
    recentHistory: topicHistoryRecords.slice(-historyWindow)
  };
}

function performDeduplication(
  agenda: ReturnType<typeof buildAgendaWithWeekSlots>,
  history: TopicHistoryRecord[],
  rigor: "strict" | "balanced" | "flexible",
  attempt: number
) {
  const acceptedAgenda: ReturnType<typeof buildAgendaWithWeekSlots> = [];
  const rejectedThemes = new Set<string>();
  const allowAngleVariationAfterAttempt = attempt >= 3;

  for (const item of agenda) {
    const hasInternalDuplicate = shouldBlockForInternalDuplicate(item, acceptedAgenda, rigor);
    const collidesWithHistory = shouldBlockForHistoryDuplicate(item, history, {
      allowAngleVariationAfterAttempt
    });

    if (hasInternalDuplicate || collidesWithHistory) {
      rejectedThemes.add(item.theme);
      rejectedThemes.add(`${item.themeCategory}: ${item.contentAngle}`);
      item.topicKeywords.forEach((keyword) => rejectedThemes.add(keyword));
      continue;
    }

    acceptedAgenda.push(item);
  }

  return {
    dedupedAgenda: acceptedAgenda,
    rejectedThemes: Array.from(rejectedThemes)
  };
}

export async function generateWeeklyContentPlan(
  referenceDate = new Date(),
  options?: {
    windowMode?: "next-week" | "rolling-7d";
    userId?: string;
  }
) {
  if (options?.userId) {
    await throwIfGenerationCancelled(options.userId);
  }
  const brandProfile = await getBrandProfile(options?.userId);
  const weekSlots = buildWeekSlots(brandProfile, referenceDate, {
    windowMode: options?.windowMode
  });
  if (weekSlots.length === 0) {
    throw new Error("At least one active day with a valid post schedule is required.");
  }

  const contentHistory = await getContentHistory(options?.userId);
  const topicHistoryRecords = await getTopicsHistoryRecords(options?.userId);
  const currentTopics = await fetchCurrentTopics(brandProfile.researchQueries, options?.userId);
  let dedupedAgenda: ReturnType<typeof buildAgendaWithWeekSlots> | null = null;
  let rejectedThemes: string[] = [];

  for (let attempt = 1; attempt <= MAX_WEEKLY_AGENDA_ATTEMPTS; attempt += 1) {
    if (options?.userId) {
      await throwIfGenerationCancelled(options.userId);
    }
    const { historyWindow, recentHistory } = buildRecentHistoryWindow(
      topicHistoryRecords,
      brandProfile.historyLookbackDays || 60,
      attempt
    );
    const recentTopics = recentHistory.map((entry) => entry.theme);

    const generatedAgenda = await requestPromptedWeeklyAgenda({
      brandProfile,
      weekSlots,
      currentTopics,
      recentTopics,
      rejectedThemes: rejectedThemes.slice(-MAX_REJECTED_THEMES_IN_PROMPT)
    });
    if (options?.userId) {
      await throwIfGenerationCancelled(options.userId);
    }

    const agenda = buildAgendaWithWeekSlots(generatedAgenda, weekSlots);
    const dedupeResult = performDeduplication(
      agenda,
      recentHistory,
      brandProfile.generationRigor || "balanced",
      attempt
    );

    if (dedupeResult.dedupedAgenda.length === agenda.length) {
      dedupedAgenda = dedupeResult.dedupedAgenda;
      break;
    }

    rejectedThemes = Array.from(new Set([...rejectedThemes, ...dedupeResult.rejectedThemes]));
    console.warn("[content-system] Weekly agenda attempt rejected due to repeated themes", {
      attempt,
      topicsWindow: historyWindow,
      totalRejected: rejectedThemes.length
    });
  }

  if (!dedupedAgenda) {
    throw new Error(
      `Weekly agenda generation failed after ${MAX_WEEKLY_AGENDA_ATTEMPTS} attempts. ` +
      `Try reducing repeated rules, lowering the history lookback window, or clearing old topic history so the planner has room to create new angles.`
    );
  }

  const nextContentHistory = [
    ...contentHistory,
    ...dedupedAgenda.map((item) => ({ date: item.date, day: item.day, theme: item.theme }))
  ];

  const newTopicHistory = buildTopicHistoryRecords(dedupedAgenda);
  const nextTopicHistoryRecords = mergeTopicHistoryRecords(topicHistoryRecords, newTopicHistory);
  await saveWeeklyContentResult({
    userId: options?.userId,
    agenda: dedupedAgenda,
    contentHistory: nextContentHistory,
    topicHistoryRecords: nextTopicHistoryRecords,
    currentTopics
  });

  return {
    agenda: dedupedAgenda,
    currentTopics,
    brandProfile,
    topicsHistory: buildTopicsHistoryEntries(dedupedAgenda)
  };
}
