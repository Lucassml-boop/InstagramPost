import {
  shouldRunTopicsHistoryCleanup,
  shouldSkipAutomationLoop,
  type TopicsHistoryCleanupFrequency
} from "@/lib/content-system-utils";
import { DAY_ORDER } from "./content-system.constants.ts";
import { generateWeeklyContentPlan } from "./content-system.weekly-plan.ts";
import {
  clearTopicsHistory,
  getBrandProfile,
  getCurrentWeeklyAgenda
} from "./content-system.storage.ts";
import { getDayConfig } from "./content-system.schedule.ts";

export async function runMonthlyTopicsHistoryCleanup() {
  const result = await clearTopicsHistory();
  return {
    ok: true as const,
    ...result
  };
}

export async function runTopicsHistoryCleanupAutomation(referenceDate = new Date()) {
  const profile = await getBrandProfile();
  const frequency = profile.topicsHistoryCleanupFrequency as TopicsHistoryCleanupFrequency;
  if (!shouldRunTopicsHistoryCleanup(frequency, referenceDate)) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "not-scheduled-today",
      frequency
    };
  }
  return {
    ok: true as const,
    skipped: false as const,
    frequency,
    ...(await clearTopicsHistory())
  };
}

export async function runWeeklyContentAutomationLoop(referenceDate = new Date()) {
  const profile = await getBrandProfile();
  if (!profile.automationLoopEnabled) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "disabled"
    };
  }
  const currentAgenda = await getCurrentWeeklyAgenda();
  const enabledDays = DAY_ORDER.filter((day) => getDayConfig(profile, day).enabled);
  if (shouldSkipAutomationLoop(currentAgenda, referenceDate, enabledDays)) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "already-generated"
    };
  }
  return {
    ok: true as const,
    skipped: false as const,
    ...(await generateWeeklyContentPlan(referenceDate))
  };
}
