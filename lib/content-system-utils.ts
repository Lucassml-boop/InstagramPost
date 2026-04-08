import type { ContentPlanItem } from "@/lib/content-system";

export type TopicsHistoryCleanupFrequency = "disabled" | "daily" | "weekly" | "monthly";

export function normalizeTopic(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAgendaWeekKey(agenda: ContentPlanItem[]) {
  return agenda
    .map((item) => item.date)
    .sort()
    .join("|");
}

export function getUpcomingWeekKey(referenceDate: Date, dayLabels: readonly string[]) {
  const local = new Date(referenceDate);
  const day = local.getDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const monday = new Date(local);
  monday.setDate(local.getDate() + daysUntilNextMonday);
  monday.setHours(0, 0, 0, 0);

  return dayLabels
    .map((_, index) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + index);
      return current.toISOString().slice(0, 10);
    })
    .sort()
    .join("|");
}

export function isSameOrSimilarTopic(candidate: string, existing: string) {
  if (!candidate || !existing) {
    return false;
  }

  if (candidate === existing || candidate.includes(existing) || existing.includes(candidate)) {
    return true;
  }

  const candidateWords = new Set(candidate.split(" ").filter((word) => word.length >= 4));
  const existingWords = new Set(existing.split(" ").filter((word) => word.length >= 4));
  let overlap = 0;

  for (const word of candidateWords) {
    if (existingWords.has(word)) {
      overlap += 1;
    }
  }

  return overlap >= 2;
}

export function buildTopicsHistoryEntries(agenda: ContentPlanItem[]) {
  return Array.from(
    new Set(
      agenda
        .flatMap((item) => [item.theme, ...item.topicKeywords])
        .map((entry) => normalizeTopic(entry))
        .filter(Boolean)
    )
  );
}

export function shouldSkipAutomationLoop(
  currentAgenda: ContentPlanItem[],
  referenceDate: Date,
  dayLabels: readonly string[]
) {
  return (
    currentAgenda.length > 0 &&
    getAgendaWeekKey(currentAgenda) === getUpcomingWeekKey(referenceDate, dayLabels)
  );
}

export function shouldRunTopicsHistoryCleanup(
  frequency: TopicsHistoryCleanupFrequency,
  referenceDate: Date
) {
  if (frequency === "disabled") {
    return false;
  }

  if (frequency === "daily") {
    return true;
  }

  if (frequency === "weekly") {
    return referenceDate.getDay() === 0;
  }

  return referenceDate.getDate() === 1;
}
