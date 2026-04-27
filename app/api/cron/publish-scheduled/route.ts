import { NextResponse } from "next/server";
import { finishAutomationRun, startAutomationRun } from "@/lib/automation-runs";
import { ensureCronAccess } from "@/lib/cron-auth";
import { prepareUpcomingAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import { processScheduledPosts } from "@/lib/posts";
import { getRequestOrigin } from "@/lib/server-utils";

async function handlePublishScheduled(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const run = await startAutomationRun({ job: "publish-scheduled" });

  try {
    const preGeneration = await prepareUpcomingAgendaPosts();
    const publishResult = await processScheduledPosts(getRequestOrigin(request));
    const summary = {
      processed: publishResult.published,
      due: publishResult.due,
      attempted: publishResult.attempted,
      failed: publishResult.failed,
      skipped: publishResult.skipped,
      preGenerated: preGeneration.prepared,
      scannedAgendaItems: preGeneration.scanned
    };
    await finishAutomationRun({
      id: run?.id,
      status: "SUCCEEDED",
      summary
    });

    return NextResponse.json({
      ok: true,
      ...summary
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishAutomationRun({
      id: run?.id,
      status: "FAILED",
      error: message
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handlePublishScheduled(request);
}

export async function POST(request: Request) {
  return handlePublishScheduled(request);
}
