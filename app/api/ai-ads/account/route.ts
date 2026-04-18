import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  getMetaAdsAccountSettings,
  saveMetaAdsAccountSettings
} from "@/lib/meta-ads";
import { jsonError } from "@/lib/server-utils";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const account = await getMetaAdsAccountSettings(user.id);

  return NextResponse.json({
    ok: true,
    account
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    await saveMetaAdsAccountSettings(user.id, body);
    const account = await getMetaAdsAccountSettings(user.id);

    return NextResponse.json({
      ok: true,
      account
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid Meta Ads settings.", 400);
    }

    return jsonError(
      error instanceof Error ? error.message : "Unable to save Meta Ads settings.",
      500
    );
  }
}
