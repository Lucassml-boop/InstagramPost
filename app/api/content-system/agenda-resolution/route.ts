import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getWeeklyAgendaState,
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage,
  updateWeeklyAgendaResolution
} from "@/lib/content-system.agenda-metadata";
import { attachAgendaPostStatuses } from "@/lib/content-system.agenda-status";
import { getContentBrandProfile, getCurrentWeeklyAgenda } from "@/lib/content-system";
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { jsonError } from "@/lib/server-utils";

const requestSchema = z.object({
  resolution: z.enum(["KEEP_UNUSED"])
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const parsed = requestSchema.parse(await request.json());
    const [agenda, profile] = await Promise.all([
      getCurrentWeeklyAgenda(user.id),
      getContentBrandProfile(user.id)
    ]);

    const [agendaWithStatus, metadata] = await Promise.all([
      attachAgendaPostStatuses(user.id, agenda),
      updateWeeklyAgendaResolution(user.id, parsed.resolution)
    ]);
    const totalExpectedPosts = countConfirmedWeeklyPosts(profile);

    return NextResponse.json({
      ok: true,
      agendaSummary: summarizeWeeklyAgendaUsage({
        agenda: agendaWithStatus,
        totalExpectedPosts,
        metadata: serializeWeeklyAgendaState(
          (await getWeeklyAgendaState(user.id)) ?? metadata
        )
      })
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to update weekly agenda resolution.",
      400
    );
  }
}
