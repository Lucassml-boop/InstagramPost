import { NextResponse } from "next/server";
import { finishAutomationRun, startAutomationRun } from "@/lib/automation-runs";
import { ensureCronAccess } from "@/lib/cron-auth";
import { runWeeklyContentAutomationLoop } from "@/lib/content-system";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        instagramAccount: {
          connected: true
        }
      },
      select: { id: true }
    });
    const results = [];

    for (const user of users) {
      const run = await startAutomationRun({ job: "generate-weekly-content", userId: user.id });
      try {
        const result = await runWeeklyContentAutomationLoop(new Date(), user.id);
        const summary = {
          skipped: result.skipped,
          reason: result.skipped ? result.reason : null,
          generated: result.skipped ? 0 : result.agenda.length
        };
        await finishAutomationRun({
          id: run?.id,
          status: "SUCCEEDED",
          summary
        });
        results.push({
          userId: user.id,
          ...result
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await finishAutomationRun({
          id: run?.id,
          status: "FAILED",
          error: message
        });
        results.push({
          userId: user.id,
          ok: false as const,
          skipped: true as const,
          reason: message
        });
      }
    }
    const generated = results.reduce(
      (total, result) => total + (result.skipped ? 0 : result.agenda.length),
      0
    );
    return NextResponse.json({
      ok: true,
      users: results.length,
      generated,
      results: results.map((result) => ({
        userId: result.userId,
        skipped: result.skipped,
        reason: result.skipped ? result.reason : null,
        generated: result.skipped ? 0 : result.agenda.length
      }))
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
