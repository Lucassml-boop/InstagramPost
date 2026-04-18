import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncMetaAdsAccount } from "@/lib/meta-ads";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request
      .json()
      .catch(() => ({}));
    const dashboard = await syncMetaAdsAccount(user.id, body);

    return NextResponse.json({
      ok: true,
      ...dashboard
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to sync Meta Ads data.",
      500
    );
  }
}
