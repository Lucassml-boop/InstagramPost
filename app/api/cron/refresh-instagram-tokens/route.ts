import { NextResponse } from "next/server";
import { finishAutomationRun, startAutomationRun } from "@/lib/automation-runs";
import { ensureCronAccess } from "@/lib/cron-auth";
import { refreshInstagramAccessTokens } from "@/lib/instagram";

async function handleRefreshInstagramTokens(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const run = await startAutomationRun({ job: "refresh-instagram-tokens" });

  try {
    const refreshed = await refreshInstagramAccessTokens();
    await finishAutomationRun({
      id: run?.id,
      status: "SUCCEEDED",
      summary: { refreshed }
    });
    return NextResponse.json({ refreshed });
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
  return handleRefreshInstagramTokens(request);
}

export async function POST(request: Request) {
  return handleRefreshInstagramTokens(request);
}
