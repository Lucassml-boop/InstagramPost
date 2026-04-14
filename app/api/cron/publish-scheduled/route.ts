import { NextResponse } from "next/server";
import { ensureCronAccess } from "@/lib/cron-auth";
import { prepareUpcomingAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import { processScheduledPosts } from "@/lib/posts";
import { getRequestOrigin } from "@/lib/server-utils";

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const preGeneration = await prepareUpcomingAgendaPosts();
  const count = await processScheduledPosts(getRequestOrigin(request));
  return NextResponse.json({
    processed: count,
    preGenerated: preGeneration.prepared,
    scannedAgendaItems: preGeneration.scanned
  });
}
