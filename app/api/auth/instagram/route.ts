import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth";
import { getBaseUrl, getInstagramRedirectUri } from "@/lib/env";
import { getInstagramAuthUrl } from "@/lib/instagram";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const baseUrl = getBaseUrl(requestOrigin);
  const redirectUri = getInstagramRedirectUri(requestOrigin);

  if (
    process.env.NODE_ENV !== "production" &&
    redirectUri.includes(".trycloudflare.com/")
  ) {
    const helpMessage =
      "Instagram OAuth bloqueado em desenvolvimento: o callback atual usa um dominio trycloudflare temporario, que nao esta cadastrado no Meta App. Defina FIXED_PUBLIC_URL em .env.local, reinicie npm run dev e cadastre exatamente a nova callback no Meta.";

    console.warn("[instagram-auth] Blocking OAuth with temporary trycloudflare callback", {
      redirectUri,
      baseUrl
    });

    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(helpMessage)}`, baseUrl)
    );
  }

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
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 600
  });

  console.log("[instagram-auth] Starting OAuth flow", {
    userId: user.id,
    baseUrl,
    redirectUri,
    stateLength: state.length
  });

  return NextResponse.redirect(getInstagramAuthUrl(state, redirectUri));
}
