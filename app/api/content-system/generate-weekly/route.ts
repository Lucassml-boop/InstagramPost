import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage,
  upsertWeeklyAgendaState
} from "@/lib/content-system.agenda-metadata";
import { attachAgendaPostStatuses } from "@/lib/content-system.agenda-status";
import { generateWeeklyContentPlan, getContentBrandProfile } from "@/lib/content-system";
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { jsonError } from "@/lib/server-utils";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await generateWeeklyContentPlan();
    const [agendaWithStatus, metadata, profile] = await Promise.all([
      attachAgendaPostStatuses(user.id, result.agenda),
      upsertWeeklyAgendaState(user.id, result.agenda),
      getContentBrandProfile()
    ]);
    const totalExpectedPosts = countConfirmedWeeklyPosts(profile);
    const agendaSummary = summarizeWeeklyAgendaUsage({
      agenda: agendaWithStatus,
      totalExpectedPosts,
      metadata: serializeWeeklyAgendaState(metadata)
    });

    return NextResponse.json({
      ok: true,
      agenda: agendaWithStatus,
      agendaSummary,
      currentTopics: result.currentTopics
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Weekly content generation failed.",
      500
    );
  }
}
