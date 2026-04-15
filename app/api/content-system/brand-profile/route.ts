import { getCurrentUser } from "@/lib/auth";
import { handleGetBrandProfile } from "@/lib/api-handlers/content-system";
import {
  getWeeklyAgendaState,
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage
} from "@/lib/content-system.agenda-metadata";
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { getContentBrandProfile, updateContentBrandProfile } from "@/lib/content-system";
import { materializeConfirmedAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import { jsonError } from "@/lib/server-utils";

export async function GET() {
  const user = await getCurrentUser();
  return handleGetBrandProfile(user);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  try {
    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const profile = await updateContentBrandProfile(await request.json());
    const result = await materializeConfirmedAgendaPosts(user);
    const agendaState = await getWeeklyAgendaState(user.id);
    const agendaSummary = summarizeWeeklyAgendaUsage({
      agenda: result.agenda,
      totalExpectedPosts: countConfirmedWeeklyPosts(profile),
      metadata: serializeWeeklyAgendaState(agendaState)
    });

    return Response.json({
      ok: true,
      profile,
      agenda: result.agenda,
      weekPosts: result.weekPosts,
      agendaSummary,
      prepared: result.prepared,
      scanned: result.scanned
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to save content automation settings."
    );
  }
}
