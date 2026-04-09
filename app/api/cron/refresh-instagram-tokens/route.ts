import { NextResponse } from "next/server";
import { ensureCronAccess } from "@/lib/cron-auth";
import { refreshInstagramAccessTokens } from "@/lib/instagram";

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const refreshed = await refreshInstagramAccessTokens();
  return NextResponse.json({ refreshed });
}
