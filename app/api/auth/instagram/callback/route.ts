import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth";
import { getBaseUrl } from "@/lib/env";
import {
  exchangeCodeForAccessToken,
  fetchInstagramProfile,
  saveInstagramAccount
} from "@/lib/instagram";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", getBaseUrl()));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorReason = url.searchParams.get("error_reason");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(errorReason ?? error)}`, getBaseUrl())
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=Missing%20authorization%20code", getBaseUrl())
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/dashboard?error=Invalid%20OAuth%20state", getBaseUrl())
    );
  }

  try {
    const tokenResponse = await exchangeCodeForAccessToken(code);
    const profile = await fetchInstagramProfile(
      tokenResponse.accessToken,
      tokenResponse.instagramUserId
    );

    await saveInstagramAccount({
      userId: user.id,
      instagramUserId: profile.instagramUserId,
      username: profile.username,
      profilePictureUrl: profile.profilePictureUrl,
      accessToken: tokenResponse.accessToken
    });

    return NextResponse.redirect(new URL("/dashboard?connected=1", getBaseUrl()));
  } catch (callbackError) {
    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Unable to complete Instagram authentication.";

    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, getBaseUrl())
    );
  }
}
