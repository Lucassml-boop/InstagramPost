import { decryptValue, encryptValue, hashSensitiveValue } from "@/lib/crypto";
import { getBaseUrl, requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_API_VERSION = "v23.0";
const LONG_LIVED_TOKEN_LIFETIME_SECONDS = 60 * 24 * 60 * 60;
const TOKEN_REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_MIN_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MEDIA_CONTAINER_POLL_INTERVAL_MS = 2_000;
const MEDIA_CONTAINER_MAX_WAIT_MS = 30_000;

export type InstagramPostType = "feed" | "story" | "carousel";
export type PublishableMediaItem = {
  imageUrl: string;
  imagePath: string;
};

function getTokenExpiryDate(expiresInSeconds?: string | number | null) {
  const seconds = Number(expiresInSeconds);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000);
}

async function persistInstagramAccessToken(input: {
  accountId: string;
  accessToken: string;
  tokenExpiresAt?: Date | null;
  tokenLastRefreshedAt?: Date | null;
}) {
  const encryptedAccessToken = encryptValue(input.accessToken);

  return prisma.instagramAccount.update({
    where: { id: input.accountId },
    data: {
      accessToken: encryptedAccessToken.encrypted,
      accessTokenIv: encryptedAccessToken.iv,
      accessTokenTag: encryptedAccessToken.tag,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      tokenLastRefreshedAt: input.tokenLastRefreshedAt ?? null
    }
  });
}

export function getInstagramAuthUrl(state: string) {
  const redirectUri = requireEnv("INSTAGRAM_REDIRECT_URI");
  const url = new URL("https://www.instagram.com/oauth/authorize");

  url.searchParams.set("client_id", requireEnv("INSTAGRAM_APP_ID"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_content_publish"
  );
  url.searchParams.set("state", state);
  url.searchParams.set("force_authentication", "1");

  console.log("[instagram] Building auth URL", {
    redirectUri,
    stateLength: state.length
  });

  return url.toString();
}

export async function exchangeCodeForAccessToken(code: string) {
  const redirectUri = requireEnv("INSTAGRAM_REDIRECT_URI");
  const body = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code
  });

  console.log("[instagram] Exchanging code for token", {
    redirectUri,
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
      redirectUri,
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

export async function exchangeForLongLivedAccessToken(shortLivedAccessToken: string) {
  console.log("[instagram] Exchanging short-lived token for long-lived token", {
    accessTokenLength: shortLivedAccessToken.length
  });

  const response = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
      requireEnv("INSTAGRAM_APP_SECRET")
    )}&access_token=${encodeURIComponent(shortLivedAccessToken)}`,
    {
      cache: "no-store"
    }
  );

  const json = await response.json();

  if (!response.ok || !json.access_token) {
    console.error("[instagram] Long-lived token exchange failed", {
      status: response.status,
      errorMessage: json.error?.message ?? json.error_message ?? null,
      errorCode: json.error?.code ?? null
    });
    throw new Error(
      json.error?.message ?? json.error_message ?? "Unable to exchange for a long-lived Instagram token."
    );
  }

  const expiresAt = getTokenExpiryDate(
    json.expires_in ?? LONG_LIVED_TOKEN_LIFETIME_SECONDS
  );

  console.log("[instagram] Long-lived token exchange succeeded", {
    status: response.status,
    expiresAt: expiresAt?.toISOString() ?? null
  });

  return {
    accessToken: String(json.access_token),
    expiresAt
  };
}

export async function refreshLongLivedAccessToken(accessToken: string) {
  console.log("[instagram] Refreshing long-lived access token", {
    accessTokenLength: accessToken.length
  });

  const response = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(
      accessToken
    )}`,
    {
      cache: "no-store"
    }
  );

  const json = await response.json();

  if (!response.ok || !json.access_token) {
    console.error("[instagram] Token refresh failed", {
      status: response.status,
      errorMessage: json.error?.message ?? json.error_message ?? null,
      errorCode: json.error?.code ?? null
    });
    throw new Error(
      json.error?.message ?? json.error_message ?? "Unable to refresh Instagram access token."
    );
  }

  const expiresAt = getTokenExpiryDate(
    json.expires_in ?? LONG_LIVED_TOKEN_LIFETIME_SECONDS
  );

  console.log("[instagram] Token refresh succeeded", {
    status: response.status,
    expiresAt: expiresAt?.toISOString() ?? null
  });

  return {
    accessToken: String(json.access_token),
    expiresAt
  };
}

export async function fetchInstagramProfile(accessToken: string, instagramUserId?: string) {
  const baseEndpoints = [
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/me`,
    instagramUserId
      ? `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}`
      : null
  ].filter(Boolean) as string[];

  const fieldAttempts = [
    "id,username,account_type",
    "id,username"
  ];

  let lastError: string | null = null;

  for (const endpoint of baseEndpoints) {
    for (const fields of fieldAttempts) {
      const response = await fetch(
        `${endpoint}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`,
        {
          cache: "no-store"
        }
      );
      const json = await response.json();

      if (response.ok && !json.error) {
        const profilePictureUrl = await fetchInstagramProfilePicture(endpoint, accessToken);

        console.log("[instagram] Profile fetch succeeded", {
          endpoint,
          fields,
          instagramUserId: String(json.id ?? instagramUserId ?? "")
        });

        return {
          instagramUserId: String(json.id ?? instagramUserId ?? ""),
          username: String(json.username ?? ""),
          profilePictureUrl,
          accountType: (json.account_type as string | undefined) ?? "PROFESSIONAL"
        };
      }

      lastError = json.error?.message ?? "Unable to fetch Instagram profile.";
      console.error("[instagram] Profile fetch failed", {
        endpoint,
        fields,
        status: response.status,
        errorMessage: json.error?.message ?? null,
        errorCode: json.error?.code ?? null
      });
    }
  }

  throw new Error(lastError ?? "Unable to fetch Instagram profile.");
}

async function fetchInstagramProfilePicture(endpoint: string, accessToken: string) {
  const pictureFieldAttempts = ["profile_picture_url", "profile_pic"];

  for (const field of pictureFieldAttempts) {
    const response = await fetch(
      `${endpoint}?fields=${encodeURIComponent(field)}&access_token=${encodeURIComponent(accessToken)}`,
      {
        cache: "no-store"
      }
    );
    const json = await response.json();

    if (response.ok && !json.error) {
      return (json.profile_picture_url as string | undefined) ?? (json.profile_pic as string | undefined) ?? null;
    }
  }

  return null;
}

export async function saveInstagramAccount(input: {
  userId: string;
  instagramUserId: string;
  username: string;
  profilePictureUrl: string | null;
  accessToken: string;
  tokenExpiresAt?: Date | null;
  tokenLastRefreshedAt?: Date | null;
}) {
  const instagramUserIdHash = hashSensitiveValue(input.instagramUserId);
  const encryptedAccessToken = encryptValue(input.accessToken);
  const encryptedInstagramUserId = encryptValue(input.instagramUserId);
  const encryptedUsername = encryptValue(input.username);

  return prisma.$transaction(async (tx) => {
    const existingForUser = await tx.instagramAccount.findUnique({
      where: { userId: input.userId }
    });
    const existingForInstagram = await tx.instagramAccount.findUnique({
      where: { instagramUserIdHash }
    });

    const commonData = {
      instagramUserId: null,
      instagramUserIdHash,
      instagramUserIdEncrypted: encryptedInstagramUserId.encrypted,
      instagramUserIdIv: encryptedInstagramUserId.iv,
      instagramUserIdTag: encryptedInstagramUserId.tag,
      username: null,
      usernameEncrypted: encryptedUsername.encrypted,
      usernameIv: encryptedUsername.iv,
      usernameTag: encryptedUsername.tag,
      profilePictureUrl: input.profilePictureUrl,
      accessToken: encryptedAccessToken.encrypted,
      accessTokenIv: encryptedAccessToken.iv,
      accessTokenTag: encryptedAccessToken.tag,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      tokenLastRefreshedAt: input.tokenLastRefreshedAt ?? null,
      connected: true
    } as const;

    if (existingForInstagram) {
      if (existingForUser && existingForUser.id !== existingForInstagram.id) {
        console.warn("[instagram] Replacing current user's existing Instagram connection", {
          userId: input.userId,
          currentConnectionId: existingForUser.id,
          targetConnectionId: existingForInstagram.id
        });
        await tx.instagramAccount.delete({
          where: { id: existingForUser.id }
        });
      }

      console.info("[instagram] Reusing existing Instagram connection", {
        instagramAccountId: existingForInstagram.id,
        previousUserId: existingForInstagram.userId,
        nextUserId: input.userId
      });

      return tx.instagramAccount.update({
        where: { id: existingForInstagram.id },
        data: {
          userId: input.userId,
          ...commonData
        }
      });
    }

    if (existingForUser) {
      return tx.instagramAccount.update({
        where: { id: existingForUser.id },
        data: commonData
      });
    }

    return tx.instagramAccount.create({
      data: {
        userId: input.userId,
        ...commonData
      }
    });
  });
}

function getStoredInstagramUserId(account: {
  instagramUserId: string | null;
  instagramUserIdEncrypted: string | null;
  instagramUserIdIv: string | null;
  instagramUserIdTag: string | null;
}) {
  if (
    account.instagramUserIdEncrypted &&
    account.instagramUserIdIv &&
    account.instagramUserIdTag
  ) {
    return decryptValue({
      encrypted: account.instagramUserIdEncrypted,
      iv: account.instagramUserIdIv,
      tag: account.instagramUserIdTag
    });
  }

  return account.instagramUserId ?? "";
}

function getStoredUsername(account: {
  username: string | null;
  usernameEncrypted: string | null;
  usernameIv: string | null;
  usernameTag: string | null;
}) {
  if (account.usernameEncrypted && account.usernameIv && account.usernameTag) {
    return decryptValue({
      encrypted: account.usernameEncrypted,
      iv: account.usernameIv,
      tag: account.usernameTag
    });
  }

  return account.username ?? "";
}

export function getInstagramAccountSnapshot(account: {
  instagramUserId: string | null;
  instagramUserIdEncrypted: string | null;
  instagramUserIdIv: string | null;
  instagramUserIdTag: string | null;
  username: string | null;
  usernameEncrypted: string | null;
  usernameIv: string | null;
  usernameTag: string | null;
  profilePictureUrl: string | null;
  connected: boolean;
}) {
  return {
    instagramUserId: getStoredInstagramUserId(account),
    username: getStoredUsername(account),
    profilePictureUrl: account.profilePictureUrl,
    connected: account.connected
  };
}

export async function getInstagramAccessToken(userId: string) {
  let account = await prisma.instagramAccount.findUnique({
    where: { userId }
  });

  if (!account) {
    throw new Error("No connected Instagram account found.");
  }

  let accessToken = decryptValue({
    encrypted: account.accessToken,
    iv: account.accessTokenIv,
    tag: account.accessTokenTag
  });

  const now = Date.now();
  const expiresAtMs = account.tokenExpiresAt?.getTime() ?? 0;
  const refreshIsDue =
    !account.tokenExpiresAt || expiresAtMs - now <= TOKEN_REFRESH_WINDOW_MS;
  const refreshIsAllowed =
    !account.tokenLastRefreshedAt ||
    now - account.tokenLastRefreshedAt.getTime() >= TOKEN_MIN_REFRESH_INTERVAL_MS;

  if (refreshIsDue && refreshIsAllowed) {
    try {
      const refreshed = await refreshLongLivedAccessToken(accessToken);
      account = await persistInstagramAccessToken({
        accountId: account.id,
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.expiresAt,
        tokenLastRefreshedAt: new Date()
      });
      accessToken = refreshed.accessToken;
    } catch (error) {
      const tokenStillValid = !account.tokenExpiresAt || account.tokenExpiresAt.getTime() > now;

      console.error("[instagram] Automatic token refresh failed", {
        accountId: account.id,
        tokenStillValid,
        error: error instanceof Error ? error.message : String(error)
      });

      if (!tokenStillValid) {
        throw error;
      }
    }
  }

  return { account, accessToken };
}

async function assertImageUrlIsReachable(imageUrl: string) {
  let imageProbeResponse: Response | null = null;

  try {
    imageProbeResponse = await fetch(imageUrl, {
      method: "HEAD",
      redirect: "follow",
      cache: "no-store"
    });
  } catch {
    imageProbeResponse = null;
  }

  if (!imageProbeResponse || !imageProbeResponse.ok) {
    imageProbeResponse = await fetch(imageUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });
  }

  const imageContentType = imageProbeResponse.headers.get("content-type");

  if (!imageProbeResponse.ok) {
    throw new Error(
      `The public image URL is not reachable (${imageProbeResponse.status}) and Instagram cannot fetch it.`
    );
  }

  if (!imageContentType?.startsWith("image/")) {
    throw new Error(
      `The public image URL returned content-type ${imageContentType ?? "unknown"} instead of an image.`
    );
  }
}

async function createInstagramMediaContainer(input: {
  userId: string;
  caption: string;
  imageUrl: string;
}) {
  const { account, accessToken } = await getInstagramAccessToken(input.userId);
  const instagramUserId = getStoredInstagramUserId(account);
  await assertImageUrlIsReachable(input.imageUrl);

  const mediaBody = new URLSearchParams({
    image_url: input.imageUrl,
    caption: input.caption
  });

  const mediaResponse = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: mediaBody.toString()
    }
  );

  const mediaJson = await mediaResponse.json();

  if (!mediaResponse.ok || !mediaJson.id) {
    throw new Error(mediaJson.error?.message ?? "Unable to create Instagram media container.");
  }

  return {
    accessToken,
    instagramUserId,
    creationId: String(mediaJson.id)
  };
}

async function publishInstagramCreation(input: {
  accessToken: string;
  instagramUserId: string;
  creationId: string;
}) {
  await waitForInstagramMediaContainer({
    creationId: input.creationId,
    accessToken: input.accessToken,
    instagramUserId: input.instagramUserId
  });

  const publishBody = new URLSearchParams({
    creation_id: input.creationId
  });

  const publishResponse = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${input.instagramUserId}/media_publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: publishBody.toString()
    }
  );

  const publishJson = await publishResponse.json();

  if (!publishResponse.ok || !publishJson.id) {
    throw new Error(publishJson.error?.message ?? "Unable to publish Instagram media.");
  }

  return {
    mediaId: String(publishJson.id)
  };
}

export async function publishInstagramPost(input: {
  userId: string;
  postType: InstagramPostType;
  caption: string;
  mediaItems: PublishableMediaItem[];
}) {
  if (input.mediaItems.length === 0) {
    throw new Error("At least one image is required to publish.");
  }

  const { account, accessToken } = await getInstagramAccessToken(input.userId);
  const instagramUserId = getStoredInstagramUserId(account);

  if (input.postType === "carousel") {
    if (input.mediaItems.length < 2 || input.mediaItems.length > 10) {
      throw new Error("Carousel posts require between 2 and 10 images.");
    }

    const childCreationIds: string[] = [];

    for (const item of input.mediaItems) {
      await assertImageUrlIsReachable(item.imageUrl);

      const childBody = new URLSearchParams({
        image_url: item.imageUrl,
        is_carousel_item: "true"
      });

      const childResponse = await fetch(
        `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: childBody.toString()
        }
      );

      const childJson = await childResponse.json();

      if (!childResponse.ok || !childJson.id) {
        throw new Error(
          childJson.error?.message ?? "Unable to create Instagram carousel media item."
        );
      }

      const creationId = String(childJson.id);
      childCreationIds.push(creationId);

      await waitForInstagramMediaContainer({
        creationId,
        accessToken,
        instagramUserId
      });
    }

    const carouselBody = new URLSearchParams({
      media_type: "CAROUSEL",
      children: childCreationIds.join(","),
      caption: input.caption
    });

    const carouselResponse = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: carouselBody.toString()
      }
    );

    const carouselJson = await carouselResponse.json();

    if (!carouselResponse.ok || !carouselJson.id) {
      throw new Error(carouselJson.error?.message ?? "Unable to create Instagram carousel.");
    }

    return publishInstagramCreation({
      accessToken,
      instagramUserId,
      creationId: String(carouselJson.id)
    });
  }

  const primaryMedia = input.mediaItems[0];
  await assertImageUrlIsReachable(primaryMedia.imageUrl);

  const mediaBody = new URLSearchParams({
    image_url: primaryMedia.imageUrl,
    ...(input.postType === "story" ? { media_type: "STORIES" } : {}),
    ...(input.postType === "feed" ? { caption: input.caption } : {})
  });

  const mediaResponse = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: mediaBody.toString()
    }
  );

  const mediaJson = await mediaResponse.json();

  if (!mediaResponse.ok || !mediaJson.id) {
    throw new Error(mediaJson.error?.message ?? "Unable to create Instagram media container.");
  }

  return publishInstagramCreation({
    accessToken,
    instagramUserId,
    creationId: String(mediaJson.id)
  });
}

async function waitForInstagramMediaContainer(input: {
  creationId: string;
  accessToken: string;
  instagramUserId: string;
}) {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt <= MEDIA_CONTAINER_MAX_WAIT_MS) {
    attempt += 1;

    const statusResponse = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${input.creationId}?fields=status_code,status&access_token=${encodeURIComponent(
        input.accessToken
      )}`,
      {
        cache: "no-store"
      }
    );

    const statusJson = await statusResponse.json();
    const statusCode = String(statusJson.status_code ?? "");
    const status = String(statusJson.status ?? "");

    if (!statusResponse.ok) {
      throw new Error(
        statusJson.error?.message ?? "Unable to verify Instagram media container status."
      );
    }

    if (statusCode === "FINISHED") {
      return;
    }

    if (statusCode === "ERROR" || status === "ERROR" || statusCode === "EXPIRED") {
      throw new Error(
        `Instagram media container did not become publishable. status_code=${statusCode || "unknown"} status=${status || "unknown"}.`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, MEDIA_CONTAINER_POLL_INTERVAL_MS));
  }

  throw new Error(
    `Instagram media container was not ready after ${Math.round(MEDIA_CONTAINER_MAX_WAIT_MS / 1000)} seconds.`
  );
}

export async function refreshInstagramAccessTokens() {
  const candidates = await prisma.instagramAccount.findMany({
    where: {
      connected: true,
      OR: [
        { tokenExpiresAt: null },
        {
          tokenExpiresAt: {
            lte: new Date(Date.now() + TOKEN_REFRESH_WINDOW_MS)
          }
        }
      ]
    }
  });

  let refreshedCount = 0;

  for (const account of candidates) {
    const refreshIsAllowed =
      !account.tokenLastRefreshedAt ||
      Date.now() - account.tokenLastRefreshedAt.getTime() >= TOKEN_MIN_REFRESH_INTERVAL_MS;

    if (!refreshIsAllowed) {
      continue;
    }

    try {
      const accessToken = decryptValue({
        encrypted: account.accessToken,
        iv: account.accessTokenIv,
        tag: account.accessTokenTag
      });
      const refreshed = await refreshLongLivedAccessToken(accessToken);

      await persistInstagramAccessToken({
        accountId: account.id,
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.expiresAt,
        tokenLastRefreshedAt: new Date()
      });

      refreshedCount += 1;
    } catch (error) {
      console.error("[instagram] Scheduled token refresh failed", {
        accountId: account.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.info("[instagram] Scheduled token refresh completed", {
    candidates: candidates.length,
    refreshedCount
  });

  return refreshedCount;
}

export function getAbsoluteAssetUrl(assetPath: string, requestOrigin?: string) {
  return `${getBaseUrl(requestOrigin)}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}
