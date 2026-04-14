import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getWeeklyAgendaState,
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage
} from "@/lib/content-system.agenda-metadata";
import { attachAgendaPostStatuses } from "@/lib/content-system.agenda-status";
import { getContentBrandProfile, getCurrentWeeklyAgenda } from "@/lib/content-system";
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
  const totalExpectedPosts = Object.values(profile.weeklyAgenda).reduce(
    (total, day) => total + ((day?.enabled ?? false) ? Math.max(1, day?.postsPerDay ?? 1) : 0),
    0
  );
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
