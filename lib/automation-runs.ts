import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function isMissingAutomationRunTableError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("AutomationRun") || error.message.includes("does not exist"))
  );
}

export async function startAutomationRun(input: { job: string; userId?: string | null }) {
  try {
    return await prisma.automationRun.create({
      data: {
        job: input.job,
        userId: input.userId ?? null,
        status: "STARTED"
      },
      select: { id: true }
    });
  } catch (error) {
    if (isMissingAutomationRunTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function finishAutomationRun(input: {
  id?: string | null;
  status: "SUCCEEDED" | "FAILED";
  summary?: Prisma.InputJsonValue;
  error?: string;
}) {
  if (!input.id) {
    return;
  }

  try {
    await prisma.automationRun.update({
      where: { id: input.id },
      data: {
        status: input.status,
        summary: input.summary,
        error: input.error,
        finishedAt: new Date()
      }
    });
  } catch (error) {
    if (!isMissingAutomationRunTableError(error)) {
      throw error;
    }
  }
}

export async function getLatestAutomationRun(job: string, userId?: string | null) {
  try {
    return await prisma.automationRun.findFirst({
      where: {
        job,
        userId: userId ?? null
      },
      orderBy: { startedAt: "desc" }
    });
  } catch (error) {
    if (isMissingAutomationRunTableError(error)) {
      return null;
    }

    throw error;
  }
}
