import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth";
import { getBaseUrl, getInstagramRedirectUri } from "@/lib/env";
import {
  exchangeCodeForAccessToken,
  exchangeForLongLivedAccessToken,
  fetchInstagramProfile,
  saveInstagramAccount
} from "@/lib/instagram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const baseUrl = getBaseUrl(requestOrigin);
  const redirectUri = getInstagramRedirectUri(requestOrigin);

  if (!user) {
    console.warn("[instagram-callback] Anonymous callback, redirecting to login", {
      baseUrl
    });
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const errorReason = requestUrl.searchParams.get("error_reason");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;

  console.log("[instagram-callback] Received callback", {
    requestUrl: request.url,
    baseUrl,
    redirectUri,
    hasCode: Boolean(code),
    stateLength: state?.length ?? 0,
    expectedStateLength: expectedState?.length ?? 0,
    error: error ?? null,
    errorReason: errorReason ?? null
  });

  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);

  if (error) {
    console.error("[instagram-callback] OAuth provider returned error", {
      error,
      errorReason
    });
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(errorReason ?? error)}`, baseUrl)
    );
  }

  if (!code) {
    console.error("[instagram-callback] Missing authorization code", {
      requestUrl: request.url
    });
    return NextResponse.redirect(
      new URL("/dashboard?error=Missing%20authorization%20code", baseUrl)
    );
  }

  if (!state || !expectedState || state !== expectedState) {
    console.error("[instagram-callback] Invalid OAuth state", {
      stateLength: state?.length ?? 0,
      expectedStateLength: expectedState?.length ?? 0,
      stateMatches: state === expectedState
    });
    return NextResponse.redirect(
      new URL("/dashboard?error=Invalid%20OAuth%20state", baseUrl)
    );
  }

  try {
    console.log("[instagram-callback] Exchanging code for short-lived token", {
      userId: user.id
    });
    const tokenResponse = await exchangeCodeForAccessToken(code, redirectUri);
    console.log("[instagram-callback] Short-lived token exchange succeeded", {
      userId: user.id,
      instagramUserId: tokenResponse.instagramUserId
    });

    console.log("[instagram-callback] Exchanging for long-lived token", {
      userId: user.id
    });
    const longLivedToken = await exchangeForLongLivedAccessToken(tokenResponse.accessToken);
    console.log("[instagram-callback] Long-lived token exchange succeeded", {
      userId: user.id,
      expiresAt: longLivedToken.expiresAt?.toISOString() ?? null
    });

    console.log("[instagram-callback] Fetching Instagram profile", {
      userId: user.id,
      instagramUserId: tokenResponse.instagramUserId
    });
    const profile = await fetchInstagramProfile(
      longLivedToken.accessToken,
      tokenResponse.instagramUserId
    );
    console.log("[instagram-callback] Instagram profile fetched", {
      userId: user.id,
      instagramUserId: profile.instagramUserId,
      username: profile.username
    });

    console.log("[instagram-callback] Saving Instagram account", {
      userId: user.id,
      instagramUserId: profile.instagramUserId
    });
    await saveInstagramAccount({
      userId: user.id,
      instagramUserId: profile.instagramUserId,
      username: profile.username,
      profilePictureUrl: profile.profilePictureUrl,
      accessToken: longLivedToken.accessToken,
      tokenExpiresAt: longLivedToken.expiresAt,
      tokenLastRefreshedAt: new Date()
    });

    console.log("[instagram-callback] Instagram account connected", {
      userId: user.id,
      instagramUserId: profile.instagramUserId,
      tokenExpiresAt: longLivedToken.expiresAt?.toISOString() ?? null
    });

    return NextResponse.redirect(new URL("/dashboard?connected=1", baseUrl));
  } catch (callbackError) {
    const message =
      callbackError instanceof Error
        ? callbackError.message
        : "Unable to complete Instagram authentication.";

    console.error("[instagram-callback] Callback flow failed", {
      message,
      stack: callbackError instanceof Error ? callbackError.stack : null
    });

    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(message)}`, baseUrl)
    );
  }
}
