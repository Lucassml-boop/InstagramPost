import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAiAdsDashboardData } from "@/lib/meta-ads";
import { jsonError } from "@/lib/server-utils";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const dashboard = await getAiAdsDashboardData(user.id);

    return NextResponse.json({
      ok: true,
      ...dashboard
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to load AI Ads dashboard.",
      500
    );
  }
}
