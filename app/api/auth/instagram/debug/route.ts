import { getCurrentUser } from "@/lib/auth";
import { getBaseUrl, getInstagramRedirectUri } from "@/lib/env";
import { getInstagramAuthUrl } from "@/lib/instagram";
import { jsonError } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const baseUrl = getBaseUrl(requestOrigin);
  const redirectUri = getInstagramRedirectUri(requestOrigin);
  const authUrl = getInstagramAuthUrl("debug-state", redirectUri);
  const authUrlRedirectUri = new URL(authUrl).searchParams.get("redirect_uri");

  return Response.json({
    ok: true,
    runtime: {
      requestOrigin,
      baseUrl,
      redirectUri,
      authUrlRedirectUri
    },
    env: {
      appBaseUrl: process.env.APP_BASE_URL ?? null,
      instagramRedirectUri: process.env.INSTAGRAM_REDIRECT_URI ?? null,
      instagramAppId: process.env.INSTAGRAM_APP_ID ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null
    },
    authorizeUrl: authUrl,
    metaChecklist: [
      "Valid OAuth Redirect URI must exactly match runtime.redirectUri",
      "No trailing slash and no extra query params",
      "App ID in Meta must match env.instagramAppId",
      "Use Instagram Login product settings for the same app"
    ]
  });
}
