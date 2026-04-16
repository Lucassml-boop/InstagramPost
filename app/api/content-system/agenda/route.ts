import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  clearWeeklyAgendaState,
  getWeeklyAgendaState,
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage
} from "@/lib/content-system.agenda-metadata";
import { attachAgendaPostStatuses } from "@/lib/content-system.agenda-status";
import { DAY_ORDER } from "@/lib/content-system.constants";
import {
  clearCurrentWeeklyAgenda,
  getContentBrandProfile,
  getCurrentWeeklyAgenda,
  updateContentBrandProfile
} from "@/lib/content-system";
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { jsonError } from "@/lib/server-utils";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const [agenda, profile, agendaState] = await Promise.all([
    getCurrentWeeklyAgenda(),
    getContentBrandProfile(),
    getWeeklyAgendaState(user.id)
  ]);
  const agendaWithStatus = await attachAgendaPostStatuses(user.id, agenda);
  const totalExpectedPosts = countConfirmedWeeklyPosts(profile);
  const agendaSummary = summarizeWeeklyAgendaUsage({
    agenda: agendaWithStatus,
    totalExpectedPosts,
    metadata: serializeWeeklyAgendaState(agendaState)
  });

  return NextResponse.json({
    ok: true,
    agenda: agendaWithStatus,
    agendaSummary
  });
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const profile = await getContentBrandProfile();
    const clearedProfile = await updateContentBrandProfile({
      ...profile,
      weeklyAgenda: Object.fromEntries(
        DAY_ORDER.map((day) => [
          day,
          {
            enabled: false,
            goal: "",
            contentTypes: [],
            formats: [],
            postsPerDay: 1,
            postTimes: [],
            postIdeas: []
          }
        ])
      )
    });

    await Promise.all([clearCurrentWeeklyAgenda(), clearWeeklyAgendaState(user.id)]);

    const totalExpectedPosts = countConfirmedWeeklyPosts(clearedProfile);
    const agendaSummary = summarizeWeeklyAgendaUsage({
      agenda: [],
      totalExpectedPosts,
      metadata: null
    });

    return NextResponse.json({
      ok: true,
      profile: clearedProfile,
      agenda: [],
      weekPosts: [],
      agendaSummary
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to clear the weekly agenda."
    );
  }
}
