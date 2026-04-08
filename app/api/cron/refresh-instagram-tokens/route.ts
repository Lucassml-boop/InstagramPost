import { NextResponse } from "next/server";
import { refreshInstagramAccessTokens } from "@/lib/instagram";

export async function POST() {
  const refreshed = await refreshInstagramAccessTokens();
  return NextResponse.json({ refreshed });
}
