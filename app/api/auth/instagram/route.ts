import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";
import { getInstagramAuthUrl } from "@/lib/instagram";

export async function GET() {
  const user = await getCurrentUser();
  const baseUrl = getBaseUrl();

  if (!user) {
    console.warn("[instagram-auth] Redirecting anonymous user to login", {
      baseUrl
    });
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600
  });

  console.log("[instagram-auth] Starting OAuth flow", {
    userId: user.id,
    baseUrl,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI ?? null,
    stateLength: state.length
  });

  return NextResponse.redirect(getInstagramAuthUrl(state));
}
