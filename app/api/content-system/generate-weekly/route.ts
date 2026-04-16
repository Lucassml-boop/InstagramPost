import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage,
  upsertWeeklyAgendaState
} from "@/lib/content-system.agenda-metadata";
import { generateWeeklyContentPlan, getContentBrandProfile } from "@/lib/content-system";
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { materializeConfirmedAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import { jsonError } from "@/lib/server-utils";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await generateWeeklyContentPlan(new Date(), {
      windowMode: "rolling-7d"
    });
    const [metadata, profile] = await Promise.all([
      upsertWeeklyAgendaState(user.id, result.agenda),
      getContentBrandProfile()
    ]);
    const materialized = await materializeConfirmedAgendaPosts(user);
    const totalExpectedPosts = countConfirmedWeeklyPosts(profile);
    const agendaSummary = summarizeWeeklyAgendaUsage({
      agenda: materialized.agenda,
      totalExpectedPosts,
      metadata: serializeWeeklyAgendaState(metadata)
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
    return jsonError(
      error instanceof Error ? error.message : "Weekly content generation failed.",
      500
    );
  }
}
