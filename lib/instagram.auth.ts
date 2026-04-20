import { requireEnv } from "@/lib/env";
import {
  INSTAGRAM_API_VERSION,
  LONG_LIVED_TOKEN_LIFETIME_SECONDS
} from "./instagram.constants.ts";

function getTokenExpiryDate(expiresInSeconds?: string | number | null) {
  const seconds = Number(expiresInSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(Date.now() + seconds * 1000);
}

export function getInstagramAuthUrl(state: string, redirectUri?: string) {
  const resolvedRedirectUri = redirectUri ?? requireEnv("INSTAGRAM_REDIRECT_URI");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", requireEnv("INSTAGRAM_APP_ID"));
  url.searchParams.set("redirect_uri", resolvedRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_content_publish"
  );
  url.searchParams.set("state", state);
  url.searchParams.set("force_authentication", "1");
  console.log("[instagram] Building auth URL", {
    redirectUri: resolvedRedirectUri,
    stateLength: state.length
  });
  return url.toString();
}

export async function exchangeCodeForAccessToken(code: string, redirectUri?: string) {
  const resolvedRedirectUri = redirectUri ?? requireEnv("INSTAGRAM_REDIRECT_URI");
  const body = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: resolvedRedirectUri,
    code
  });
  console.log("[instagram] Exchanging code for token", {
    redirectUri: resolvedRedirectUri,
    codeLength: code.length
  });
  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
    cache: "no-store"
  });
  const json = await response.json();
  if (!response.ok || !json.access_token) {
    console.error("[instagram] Token exchange failed", {
      status: response.status,
      statusText: response.statusText,
      redirectUri: resolvedRedirectUri,
      errorType: json.error_type ?? null,
      errorMessage: json.error_message ?? null
    });
    throw new Error(json.error_message ?? "Unable to exchange Instagram code.");
  }
  console.log("[instagram] Token exchange succeeded", {
    status: response.status,
    instagramUserId: String(json.user_id ?? "")
  });
  return {
    accessToken: String(json.access_token),
    instagramUserId: String(json.user_id ?? "")
  };
}

async function requestGraphToken(
  endpoint: string,
  body: URLSearchParams,
  failureMessage: string
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
    cache: "no-store"
  });
  const json = await response.json();
  if (!response.ok || !json.access_token) {
    console.error("[instagram] Graph token request failed", {
      status: response.status,
      endpoint,
      errorMessage: json.error?.message ?? json.error_message ?? null,
      errorCode: json.error?.code ?? null
    });
    throw new Error(json.error?.message ?? json.error_message ?? failureMessage);
  }
  const expiresAt = getTokenExpiryDate(
    json.expires_in ?? LONG_LIVED_TOKEN_LIFETIME_SECONDS
  );
  return {
    accessToken: String(json.access_token),
    expiresAt
  };
}

export async function exchangeForLongLivedAccessToken(shortLivedAccessToken: string) {
  console.log("[instagram] Exchanging short-lived token for long-lived token", {
    accessTokenLength: shortLivedAccessToken.length
  });
  const result = await requestGraphToken(
    "https://graph.instagram.com/access_token",
    new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
      access_token: shortLivedAccessToken
    }),
    "Unable to exchange for a long-lived Instagram token."
  );
  console.log("[instagram] Long-lived token exchange succeeded", {
    expiresAt: result.expiresAt?.toISOString() ?? null
  });
  return result;
}

export async function refreshLongLivedAccessToken(accessToken: string) {
  console.log("[instagram] Refreshing long-lived access token", {
    accessTokenLength: accessToken.length
  });
  const result = await requestGraphToken(
    "https://graph.instagram.com/refresh_access_token",
    new URLSearchParams({
      grant_type: "ig_refresh_token",
      access_token: accessToken
    }),
    "Unable to refresh Instagram access token."
  );
  console.log("[instagram] Token refresh succeeded", {
    expiresAt: result.expiresAt?.toISOString() ?? null
  });
  return result;
}

export async function fetchInstagramProfile(accessToken: string, instagramUserId?: string) {
  const baseEndpoints = [
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/me`,
    instagramUserId
      ? `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}`
      : null
  ].filter(Boolean) as string[];
  const fieldAttempts = ["id,username,account_type", "id,username"];
  let lastError: string | null = null;

  for (const endpoint of baseEndpoints) {
    for (const fields of fieldAttempts) {
      const response = await fetch(
        `${endpoint}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`,
        { cache: "no-store" }
      );
      const json = await response.json();
      if (response.ok && !json.error) {
        return {
          instagramUserId: String(json.id ?? instagramUserId ?? ""),
          username: String(json.username ?? ""),
          profilePictureUrl: await fetchInstagramProfilePicture(endpoint, accessToken),
          accountType: (json.account_type as string | undefined) ?? "PROFESSIONAL"
        };
      }
      lastError = json.error?.message ?? "Unable to fetch Instagram profile.";
    }
  }

  throw new Error(lastError ?? "Unable to fetch Instagram profile.");
}

async function fetchInstagramProfilePicture(endpoint: string, accessToken: string) {
  for (const field of ["profile_picture_url", "profile_pic"]) {
    const response = await fetch(
      `${endpoint}?fields=${encodeURIComponent(field)}&access_token=${encodeURIComponent(accessToken)}`,
      { cache: "no-store" }
    );
    const json = await response.json();
    if (response.ok && !json.error) {
      return (
        (json.profile_picture_url as string | undefined) ??
        (json.profile_pic as string | undefined) ??
        null
      );
    }
  }
  return null;
}
