import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { analyzeAiAdsInput, aiAdsAnalysisInputSchema } from "@/lib/ai-ads";
import { persistAiAdsDecisionLog } from "@/lib/meta-ads";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const payload = aiAdsAnalysisInputSchema.parse(body);
    const analysis = analyzeAiAdsInput(payload);
    await persistAiAdsDecisionLog({
      userId: user.id,
      payload,
      analysis
    });

    return NextResponse.json({
      ok: true,
      analysis
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid AI Ads payload.", 400);
    }

    return jsonError(
      error instanceof Error ? error.message : "AI Ads analysis failed.",
      500
    );
  }
}
