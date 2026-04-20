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

const progressStore = new Map<string, ContentSystemGenerationProgress>();
const cancelStore = new Set<string>();
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

export function getGenerationProgress(userId: string) {
  const current = progressStore.get(userId);
  if (!current) {
    return buildDefaultProgress();
  }

  if (
    (current.state === "completed" || current.state === "failed") &&
    current.completedAt !== null &&
    Date.now() - current.completedAt > COMPLETED_TTL_MS
  ) {
    progressStore.delete(userId);
    return buildDefaultProgress();
  }

  return current;
}

export function setGenerationProgress(
  userId: string,
  patch: Partial<ContentSystemGenerationProgress>
) {
  const previous = getGenerationProgress(userId);
  const next: ContentSystemGenerationProgress = {
    ...previous,
    ...patch,
    updatedAt: Date.now()
  };
  progressStore.set(userId, next);
  return next;
}

export function startGenerationProgress(
  userId: string,
  input?: Pick<ContentSystemGenerationProgress, "stage" | "message">
) {
  cancelStore.delete(userId);
  return setGenerationProgress(userId, {
    ...buildDefaultProgress(),
    state: "running",
    stage: input?.stage ?? "saving-settings",
    message: input?.message ?? null,
    startedAt: Date.now(),
    updatedAt: Date.now()
  });
}

export function completeGenerationProgress(
  userId: string,
  input?: Pick<ContentSystemGenerationProgress, "message" | "prepared" | "scanned">
) {
  cancelStore.delete(userId);
  return setGenerationProgress(userId, {
    state: "completed",
    stage: "completed",
    completedAt: Date.now(),
    message: input?.message ?? null,
    prepared: input?.prepared ?? getGenerationProgress(userId).prepared,
    scanned: input?.scanned ?? getGenerationProgress(userId).scanned,
    activeTheme: null,
    currentPostIndex: null,
    totalPosts: null,
    errorMessage: null
  });
}

export function failGenerationProgress(userId: string, errorMessage: string) {
  cancelStore.delete(userId);
  return setGenerationProgress(userId, {
    state: "failed",
    stage: "failed",
    completedAt: Date.now(),
    errorMessage,
    message: null,
    activeTheme: null
  });
}

export function requestGenerationCancellation(userId: string) {
  cancelStore.add(userId);
  return setGenerationProgress(userId, {
    state: "running",
    message: "Cancelamento solicitado. Encerrando a geracao no proximo ponto seguro."
  });
}

export function clearGenerationCancellation(userId: string) {
  cancelStore.delete(userId);
}

export function isGenerationCancellationRequested(userId: string) {
  return cancelStore.has(userId);
}

export function throwIfGenerationCancelled(userId: string) {
  if (isGenerationCancellationRequested(userId)) {
    throw new Error("A geracao foi cancelada pelo usuario.");
  }
}
