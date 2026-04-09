import { NextResponse } from "next/server";
import { ensureCronAccess } from "@/lib/cron-auth";
import { runTopicsHistoryCleanupAutomation } from "@/lib/content-system";

export async function GET(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const result = await runTopicsHistoryCleanupAutomation();

    return NextResponse.json({
      ok: true,
      skipped: result.skipped,
      frequency: result.frequency,
      clearedEntries: result.skipped ? 0 : result.clearedEntries
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Topics history cleanup automation failed."
      },
      { status: 500 }
    );
  }
}
