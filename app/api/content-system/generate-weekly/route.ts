import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateWeeklyContentPlan } from "@/lib/content-system";
import { jsonError } from "@/lib/server-utils";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await generateWeeklyContentPlan();

    return NextResponse.json({
      ok: true,
      agenda: result.agenda,
      currentTopics: result.currentTopics
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Weekly content generation failed.",
      500
    );
  }
}
