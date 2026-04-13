import { getBaseUrl } from "@/lib/env";
import { INSTAGRAM_API_VERSION } from "./instagram.constants.ts";
import { getInstagramAccessToken, getStoredInstagramUserId } from "./instagram.access-token.ts";
import type { InstagramFeedMediaItem } from "./instagram.types.ts";

export async function fetchInstagramFeedMedia(userId: string, limit = 12) {
  const { account, accessToken } = await getInstagramAccessToken(userId);
  const instagramUserId = getStoredInstagramUserId(account);
  const endpoint = new URL(
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`
  );
  endpoint.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
  );
  endpoint.searchParams.set("limit", String(Math.max(1, Math.min(limit, 24))));
  endpoint.searchParams.set("access_token", accessToken);
  const response = await fetch(endpoint, { cache: "no-store" });
  const json = await response.json();
  if (!response.ok || !Array.isArray(json.data)) {
    throw new Error(json.error?.message ?? "Unable to fetch Instagram feed.");
  }
  return json.data.map((item: Record<string, unknown>) => ({
    id: String(item.id ?? ""),
    caption: String(item.caption ?? ""),
    mediaType: String(item.media_type ?? ""),
    mediaUrl: typeof item.media_url === "string" && item.media_url.length > 0 ? item.media_url : null,
    thumbnailUrl:
      typeof item.thumbnail_url === "string" && item.thumbnail_url.length > 0
        ? item.thumbnail_url
        : null,
    permalink:
      typeof item.permalink === "string" && item.permalink.length > 0 ? item.permalink : null,
    timestamp:
      typeof item.timestamp === "string" && item.timestamp.length > 0 ? item.timestamp : null
  })) as InstagramFeedMediaItem[];
}

export function getAbsoluteAssetUrl(assetPath: string, requestOrigin?: string) {
  return `${getBaseUrl(requestOrigin)}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}
