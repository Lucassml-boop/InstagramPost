import { NextResponse } from "next/server";
import { runWeeklyContentAutomationLoop } from "@/lib/content-system";

export async function GET() {
  try {
    const result = await runWeeklyContentAutomationLoop();

    return NextResponse.json({
      ok: true,
      skipped: result.skipped,
      reason: result.skipped ? result.reason : null,
      generated: result.skipped ? 0 : result.agenda.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Weekly content generation failed."
      },
      { status: 500 }
    );
  }
}
