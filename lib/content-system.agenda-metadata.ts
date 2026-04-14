import type { WeeklyAgendaResolution } from "@prisma/client";
import { getAgendaWeekKey } from "@/lib/content-system-utils";
import type { ContentPlanItemWithStatus } from "./content-system.agenda-status";
import type { ContentPlanItem } from "./content-system.schemas.ts";

export type WeeklyAgendaStateSnapshot = {
  generatedAt: string;
  weekStartDate: string;
  weekEndDate: string;
  weekKey: string;
  resolution: WeeklyAgendaResolution | null;
  resolutionUpdatedAt: string | null;
};

type WeeklyAgendaStateRecord = {
  generatedAt: Date;
  weekStartDate: Date;
  weekEndDate: Date;
  weekKey: string;
  resolution: WeeklyAgendaResolution | null;
  resolutionUpdatedAt: Date | null;
};

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

function toAgendaBoundary(value: string, endOfDay = false) {
  return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}-03:00`);
}

export function getAgendaWeekBounds(agenda: ContentPlanItem[]) {
  if (agenda.length === 0) {
    return null;
  }

  const dates = agenda.map((item) => item.date).sort();
  return {
    weekStartDate: dates[0],
    weekEndDate: dates.at(-1) ?? dates[0]
  };
}

async function getWeeklyAgendaDelegate() {
  const { prisma } = await import("@/lib/prisma");
  const delegate = (prisma as unknown as {
    weeklyAgendaState?: {
      findUnique: (input: { where: { userId: string } }) => Promise<WeeklyAgendaStateRecord | null>;
      upsert: (input: {
        where: { userId: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => Promise<WeeklyAgendaStateRecord>;
    };
  }).weeklyAgendaState;

  return delegate ?? null;
}

function isMissingWeeklyAgendaStateTableError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("WeeklyAgendaState") &&
    error.message.includes("does not exist")
  );
}

export async function getWeeklyAgendaState(userId: string) {
  const delegate = await getWeeklyAgendaDelegate();

  if (!delegate) {
    return null;
  }

  try {
    return await delegate.findUnique({
      where: { userId }
    });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function upsertWeeklyAgendaState(
  userId: string,
  agenda: ContentPlanItem[],
  generatedAt = new Date()
) {
  const delegate = await getWeeklyAgendaDelegate();
  const bounds = getAgendaWeekBounds(agenda);

  if (!bounds || !delegate) {
    return null;
  }

  const payload = {
    generatedAt,
    weekStartDate: toAgendaBoundary(bounds.weekStartDate),
    weekEndDate: toAgendaBoundary(bounds.weekEndDate, true),
    weekKey: getAgendaWeekKey(agenda),
    resolution: null,
    resolutionUpdatedAt: null
  };

  try {
    return await delegate.upsert({
      where: { userId },
      create: {
        userId,
        ...payload
      },
      update: payload
    });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function updateWeeklyAgendaResolution(
  userId: string,
  resolution: WeeklyAgendaResolution
) {
  const delegate = await getWeeklyAgendaDelegate();

  if (!delegate) {
    return null;
  }

  try {
    return await delegate.upsert({
      where: { userId },
      create: {
        userId,
        generatedAt: new Date(),
        weekStartDate: new Date(),
        weekEndDate: new Date(),
        weekKey: "",
        resolution,
        resolutionUpdatedAt: new Date()
      },
      update: {
        resolution,
        resolutionUpdatedAt: new Date()
      }
    });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) {
      return null;
    }

    throw error;
  }
}

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

export function serializeWeeklyAgendaState(
  state: WeeklyAgendaStateRecord | null
) {
  if (!state) {
    return null;
  }

  return {
    generatedAt: state.generatedAt.toISOString(),
    weekStartDate: state.weekStartDate.toISOString().slice(0, 10),
    weekEndDate: state.weekEndDate.toISOString().slice(0, 10),
    weekKey: state.weekKey,
    resolution: state.resolution,
    resolutionUpdatedAt: state.resolutionUpdatedAt?.toISOString() ?? null
  } satisfies WeeklyAgendaStateSnapshot;
}
