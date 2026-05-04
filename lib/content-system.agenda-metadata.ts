import type { WeeklyAgendaResolution } from "@prisma/client";
import { getAgendaWeekKey } from "@/lib/content-system-utils";
import type { ContentPlanItemWithStatus } from "./content-system.agenda-status";
import {
  getAgendaWeekBounds,
  toAgendaBoundary,
  type WeeklyAgendaStateSnapshot
} from "./content-system.agenda-state.ts";

export type { WeeklyAgendaStateSnapshot } from "./content-system.agenda-state.ts";
export {
  clearWeeklyAgendaState,
  getAgendaWeekBounds,
  getWeeklyAgendaState,
  serializeWeeklyAgendaState,
  updateWeeklyAgendaResolution,
  upsertWeeklyAgendaState
} from "./content-system.agenda-state.ts";

export type WeeklyAgendaUsageSummary = {
  weekState: "current" | "past" | "upcoming" | "empty";
  generatedAt: string | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
  weekKey: string | null;
  resolution: WeeklyAgendaResolution | null;
  resolutionUpdatedAt: string | null;
  shouldPromptReuse: boolean;
  hasUnusedPosts: boolean;
  unusedPostsCount: number;
};

export function summarizeWeeklyAgendaUsage(input: {
  agenda: ContentPlanItemWithStatus[];
  totalExpectedPosts: number;
  metadata: WeeklyAgendaStateSnapshot | null;
  now?: Date;
}) {
  const { agenda, totalExpectedPosts, metadata } = input;
  const now = input.now ?? new Date();

  if (agenda.length === 0) {
    return {
      weekState: "empty",
      generatedAt: metadata?.generatedAt ?? null,
      weekStartDate: metadata?.weekStartDate ?? null,
      weekEndDate: metadata?.weekEndDate ?? null,
      weekKey: metadata?.weekKey ?? null,
      resolution: metadata?.resolution ?? null,
      resolutionUpdatedAt: metadata?.resolutionUpdatedAt ?? null,
      shouldPromptReuse: false,
      hasUnusedPosts: false,
      unusedPostsCount: 0
    } satisfies WeeklyAgendaUsageSummary;
  }

  const bounds = getAgendaWeekBounds(agenda);
  const weekStartDate = metadata?.weekStartDate ?? bounds?.weekStartDate ?? null;
  const weekEndDate = metadata?.weekEndDate ?? bounds?.weekEndDate ?? null;
  const start = weekStartDate ? toAgendaBoundary(weekStartDate) : null;
  const end = weekEndDate ? toAgendaBoundary(weekEndDate, true) : null;

  const weekState =
    !start || !end
      ? "empty"
      : now < start
        ? "upcoming"
        : now > end
          ? "past"
          : "current";

  const usedCount = agenda.filter((item) => item.postGenerationStatus === "published").length;
  const generatedCount = agenda.filter((item) => item.postGenerationStatus !== "not-generated").length;
  const unusedPostsCount = Math.max(totalExpectedPosts - usedCount, 0);
  const hasUnusedPosts = unusedPostsCount > 0 || generatedCount < totalExpectedPosts;
  const shouldPromptReuse =
    weekState === "past" &&
    hasUnusedPosts &&
    metadata?.resolution !== "KEEP_UNUSED";

  return {
    weekState,
    generatedAt: metadata?.generatedAt ?? null,
    weekStartDate,
    weekEndDate,
    weekKey: metadata?.weekKey ?? (bounds ? getAgendaWeekKey(agenda) : null),
    resolution: metadata?.resolution ?? null,
    resolutionUpdatedAt: metadata?.resolutionUpdatedAt ?? null,
    shouldPromptReuse,
    hasUnusedPosts,
    unusedPostsCount
  } satisfies WeeklyAgendaUsageSummary;
}
