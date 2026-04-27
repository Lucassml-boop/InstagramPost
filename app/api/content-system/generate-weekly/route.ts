import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage,
  upsertWeeklyAgendaState
} from "@/lib/content-system.agenda-metadata";
import {
  clearGenerationCancellation,
  completeGenerationProgress,
  failGenerationProgress,
  setGenerationProgress,
  startGenerationProgress
} from "@/lib/content-system.generation-progress";
import { generateWeeklyContentPlan, getContentBrandProfile } from "@/lib/content-system";
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { materializeConfirmedAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import { rateLimitResponse } from "@/lib/rate-limit";
import { jsonError } from "@/lib/server-utils";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const rateLimit = rateLimitResponse({
    key: `content-system:generate-weekly:${user.id}`,
    limit: 4,
    windowMs: 60 * 60 * 1000
  });
  if (rateLimit) {
    return rateLimit;
  }

  const startedAt = Date.now();
  let currentStage =
    "generating-weekly-plan" as
      | "generating-weekly-plan"
      | "saving-metadata"
      | "materializing-posts"
      | "summarizing-response";
  const heartbeat = setInterval(() => {
    console.info("[content-system] generate-weekly request still running", {
      userId: user.id,
      stage: currentStage,
      elapsedMs: Date.now() - startedAt
    });
  }, 30_000);

  try {
    clearGenerationCancellation(user.id);
    startGenerationProgress(user.id, {
      stage: "generating-weekly-plan",
      message: "Pesquisando temas e montando a agenda dos proximos 7 dias."
    });
    console.info("[content-system] generate-weekly request started", {
      userId: user.id
    });

    const result = await generateWeeklyContentPlan(new Date(), {
      windowMode: "rolling-7d",
      userId: user.id
    });
    console.info("[content-system] Weekly agenda plan generated", {
      userId: user.id,
      agendaCount: result.agenda.length,
      currentTopicsCount: result.currentTopics.length,
      elapsedMs: Date.now() - startedAt
    });

    currentStage = "saving-metadata";
    setGenerationProgress(user.id, {
      stage: "saving-settings",
      message: "Salvando metadados e estado da agenda gerada."
    });
    const [metadata, profile] = await Promise.all([
      upsertWeeklyAgendaState(user.id, result.agenda),
      getContentBrandProfile(user.id)
    ]);

    console.info("[content-system] Weekly agenda metadata updated", {
      userId: user.id,
      elapsedMs: Date.now() - startedAt
    });

    currentStage = "materializing-posts";
    setGenerationProgress(user.id, {
      stage: "materializing-posts",
      message: "Preparando posts e imagens vinculados a agenda.",
      prepared: 0,
      scanned: 0,
      activeTheme: null,
      currentPostIndex: null,
      totalPosts: null
    });
    const materialized = await materializeConfirmedAgendaPosts(user, new Date(), {
      onProgress(progress) {
        setGenerationProgress(user.id, {
          stage: "materializing-posts",
          message: progress.message ?? "Preparando posts vinculados a agenda.",
          prepared: progress.prepared ?? 0,
          scanned: progress.scanned ?? 0,
          activeTheme: progress.activeTheme ?? null,
          currentPostIndex: progress.currentPostIndex ?? null,
          totalPosts: progress.totalPosts ?? null
        });
      }
    });
    console.info("[content-system] Weekly agenda post materialization finished", {
      userId: user.id,
      prepared: materialized.prepared,
      scanned: materialized.scanned,
      elapsedMs: Date.now() - startedAt
    });

    currentStage = "summarizing-response";
    setGenerationProgress(user.id, {
      stage: "summarizing-response",
      message: "Consolidando o resultado final para atualizar a tela.",
      prepared: materialized.prepared,
      scanned: materialized.scanned,
      activeTheme: null,
      currentPostIndex: null,
      totalPosts: materialized.scanned
    });
    const totalExpectedPosts = countConfirmedWeeklyPosts(profile);
    const agendaSummary = summarizeWeeklyAgendaUsage({
      agenda: materialized.agenda,
      totalExpectedPosts,
      metadata: serializeWeeklyAgendaState(metadata)
    });

    console.info("[content-system] generate-weekly request completed", {
      userId: user.id,
      elapsedMs: Date.now() - startedAt,
      prepared: materialized.prepared,
      scanned: materialized.scanned
    });
    completeGenerationProgress(user.id, {
      message: "Agenda concluida e sincronizada com a tela.",
      prepared: materialized.prepared,
      scanned: materialized.scanned
    });

    return NextResponse.json({
      ok: true,
      agenda: materialized.agenda,
      weekPosts: materialized.weekPosts,
      agendaSummary,
      currentTopics: result.currentTopics,
      prepared: materialized.prepared,
      scanned: materialized.scanned
    });
  } catch (error) {
    failGenerationProgress(
      user.id,
      error instanceof Error ? error.message : "Weekly content generation failed."
    );
    console.error("[content-system] generate-weekly request failed", {
      userId: user.id,
      stage: currentStage,
      elapsedMs: Date.now() - startedAt,
      error
    });
    return jsonError(
      error instanceof Error ? error.message : "Weekly content generation failed.",
      500
    );
  } finally {
    clearInterval(heartbeat);
  }
}
