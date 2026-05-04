import { prisma } from "@/lib/prisma";

export type ContentSystemGenerationStage =
  | "saving-settings"
  | "generating-weekly-plan"
  | "materializing-posts"
  | "summarizing-response"
  | "completed"
  | "failed";

export type ContentSystemGenerationProgress = {
  state: "idle" | "running" | "completed" | "failed";
  stage: ContentSystemGenerationStage | null;
  startedAt: number | null;
  updatedAt: number | null;
  completedAt: number | null;
  message: string | null;
  prepared: number;
  scanned: number;
  activeTheme: string | null;
  currentPostIndex: number | null;
  totalPosts: number | null;
  errorMessage: string | null;
};

const COMPLETED_TTL_MS = 2 * 60 * 1000;

function buildDefaultProgress(): ContentSystemGenerationProgress {
  return {
    state: "idle",
    stage: null,
    startedAt: null,
    updatedAt: null,
    completedAt: null,
    message: null,
    prepared: 0,
    scanned: 0,
    activeTheme: null,
    currentPostIndex: null,
    totalPosts: null,
    errorMessage: null
  };
}

function asProgress(payload: unknown): ContentSystemGenerationProgress {
  return { ...buildDefaultProgress(), ...(payload as Partial<ContentSystemGenerationProgress>) };
}

export async function getGenerationProgress(userId: string) {
  const current = await prisma.generationProgress.findUnique({ where: { userId } });
  if (!current) {
    return buildDefaultProgress();
  }

  const progress = asProgress(current.payload);
  if (
    (progress.state === "completed" || progress.state === "failed") &&
    progress.completedAt !== null &&
    Date.now() - progress.completedAt > COMPLETED_TTL_MS
  ) {
    await prisma.generationProgress.delete({ where: { userId } });
    return buildDefaultProgress();
  }

  return progress;
}

export async function setGenerationProgress(
  userId: string,
  patch: Partial<ContentSystemGenerationProgress>
) {
  const previous = await getGenerationProgress(userId);
  const next: ContentSystemGenerationProgress = {
    ...previous,
    ...patch,
    updatedAt: Date.now()
  };

  await prisma.generationProgress.upsert({
    where: { userId },
    create: { userId, payload: next },
    update: { payload: next }
  });

  return next;
}

export async function startGenerationProgress(
  userId: string,
  input?: Pick<ContentSystemGenerationProgress, "stage" | "message">
) {
  const next = {
    ...buildDefaultProgress(),
    state: "running" as const,
    stage: input?.stage ?? "saving-settings",
    message: input?.message ?? null,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };

  await prisma.generationProgress.upsert({
    where: { userId },
    create: { userId, payload: next, cancelRequested: false },
    update: { payload: next, cancelRequested: false }
  });

  return next;
}

export async function completeGenerationProgress(
  userId: string,
  input?: Pick<ContentSystemGenerationProgress, "message" | "prepared" | "scanned">
) {
  const current = await getGenerationProgress(userId);
  return setGenerationProgress(userId, {
    state: "completed",
    stage: "completed",
    completedAt: Date.now(),
    message: input?.message ?? null,
    prepared: input?.prepared ?? current.prepared,
    scanned: input?.scanned ?? current.scanned,
    activeTheme: null,
    currentPostIndex: null,
    totalPosts: null,
    errorMessage: null
  });
}

export async function failGenerationProgress(userId: string, errorMessage: string) {
  return setGenerationProgress(userId, {
    state: "failed",
    stage: "failed",
    completedAt: Date.now(),
    errorMessage,
    message: null,
    activeTheme: null
  });
}

export async function requestGenerationCancellation(userId: string) {
  const progress = await setGenerationProgress(userId, {
    state: "running",
    message: "Cancelamento solicitado. Encerrando a geracao no proximo ponto seguro."
  });

  await prisma.generationProgress.update({
    where: { userId },
    data: { cancelRequested: true }
  });

  return progress;
}

export async function clearGenerationCancellation(userId: string) {
  await prisma.generationProgress.upsert({
    where: { userId },
    create: { userId, payload: buildDefaultProgress(), cancelRequested: false },
    update: { cancelRequested: false }
  });
}

export async function throwIfGenerationCancelled(userId: string) {
  const current = await prisma.generationProgress.findUnique({
    where: { userId },
    select: { cancelRequested: true }
  });

  if (current?.cancelRequested) {
    throw new Error("A geracao foi cancelada pelo usuario.");
  }
}
