import { decryptValue, encryptValue, hashSensitiveValue } from "@/lib/crypto";
import { getBaseUrl, requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const INSTAGRAM_API_VERSION = "v23.0";

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
}) {
  const encryptedAccessToken = encryptValue(input.accessToken);
  const encryptedInstagramUserId = encryptValue(input.instagramUserId);
  const encryptedUsername = encryptValue(input.username);

  return prisma.instagramAccount.upsert({
    where: { userId: input.userId },
    update: {
      instagramUserId: null,
      instagramUserIdHash: hashSensitiveValue(input.instagramUserId),
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
      connected: true
    },
    create: {
      userId: input.userId,
      instagramUserId: null,
      instagramUserIdHash: hashSensitiveValue(input.instagramUserId),
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
      connected: true
    }
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
  const account = await prisma.instagramAccount.findUnique({
    where: { userId }
  });

  if (!account) {
    throw new Error("No connected Instagram account found.");
  }

  return {
    account,
    accessToken: decryptValue({
      encrypted: account.accessToken,
      iv: account.accessTokenIv,
      tag: account.accessTokenTag
    })
  };
}

export async function publishInstagramImage(input: {
  userId: string;
  caption: string;
  imageUrl: string;
}) {
  const { account, accessToken } = await getInstagramAccessToken(input.userId);
  const instagramUserId = getStoredInstagramUserId(account);
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

  const publishBody = new URLSearchParams({
    creation_id: String(mediaJson.id)
  });

  const publishResponse = await fetch(
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media_publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

export function getAbsoluteAssetUrl(assetPath: string, requestOrigin?: string) {
  return `${getBaseUrl(requestOrigin)}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}
