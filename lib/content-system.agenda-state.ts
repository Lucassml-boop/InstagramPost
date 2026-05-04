import type { WeeklyAgendaResolution } from "@prisma/client";
import { getAgendaWeekKey } from "@/lib/content-system-utils";
import type { ContentPlanItem } from "./content-system.schemas.ts";

export type WeeklyAgendaStateSnapshot = {
  generatedAt: string;
  weekStartDate: string;
  weekEndDate: string;
  weekKey: string;
  resolution: WeeklyAgendaResolution | null;
  resolutionUpdatedAt: string | null;
};

export type WeeklyAgendaStateRecord = {
  generatedAt: Date;
  weekStartDate: Date;
  weekEndDate: Date;
  weekKey: string;
  resolution: WeeklyAgendaResolution | null;
  resolutionUpdatedAt: Date | null;
};

export function toAgendaBoundary(value: string, endOfDay = false) {
  return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}-03:00`);
}

export function getAgendaWeekBounds(agenda: ContentPlanItem[]) {
  if (agenda.length === 0) return null;
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
      deleteMany?: (input: { where: { userId: string } }) => Promise<{ count: number }>;
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
  if (!delegate) return null;

  try {
    return await delegate.findUnique({ where: { userId } });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) return null;
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
  if (!bounds || !delegate) return null;

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
      create: { userId, ...payload },
      update: payload
    });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) return null;
    throw error;
  }
}

export async function updateWeeklyAgendaResolution(
  userId: string,
  resolution: WeeklyAgendaResolution
) {
  const delegate = await getWeeklyAgendaDelegate();
  if (!delegate) return null;

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
      update: { resolution, resolutionUpdatedAt: new Date() }
    });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) return null;
    throw error;
  }
}

export async function clearWeeklyAgendaState(userId: string) {
  const delegate = await getWeeklyAgendaDelegate();
  if (!delegate?.deleteMany) return null;

  try {
    return await delegate.deleteMany({ where: { userId } });
  } catch (error) {
    if (isMissingWeeklyAgendaStateTableError(error)) return null;
    throw error;
  }
}

export function serializeWeeklyAgendaState(
  state: WeeklyAgendaStateRecord | null
) {
  if (!state) return null;
  return {
    generatedAt: state.generatedAt.toISOString(),
    weekStartDate: state.weekStartDate.toISOString().slice(0, 10),
    weekEndDate: state.weekEndDate.toISOString().slice(0, 10),
    weekKey: state.weekKey,
    resolution: state.resolution,
    resolutionUpdatedAt: state.resolutionUpdatedAt?.toISOString() ?? null
  } satisfies WeeklyAgendaStateSnapshot;
}
