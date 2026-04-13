import { decryptValue } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_MIN_REFRESH_INTERVAL_MS,
  TOKEN_REFRESH_WINDOW_MS
} from "./instagram.constants.ts";
import { refreshLongLivedAccessToken } from "./instagram.auth.ts";
import {
  getStoredInstagramUserId,
  persistInstagramAccessToken
} from "./instagram.account-storage.ts";

export async function getInstagramAccessToken(userId: string) {
  let account = await prisma.instagramAccount.findUnique({ where: { userId } });
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
  const refreshIsDue = !account.tokenExpiresAt || expiresAtMs - now <= TOKEN_REFRESH_WINDOW_MS;
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
      if (!tokenStillValid) {
        throw error;
      }
    }
  }

  return { account, accessToken };
}

export async function refreshInstagramAccessTokens() {
  const candidates = await prisma.instagramAccount.findMany({
    where: {
      connected: true,
      OR: [{ tokenExpiresAt: null }, { tokenExpiresAt: { lte: new Date(Date.now() + TOKEN_REFRESH_WINDOW_MS) } }]
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
      const refreshed = await refreshLongLivedAccessToken(
        decryptValue({
          encrypted: account.accessToken,
          iv: account.accessTokenIv,
          tag: account.accessTokenTag
        })
      );
      await persistInstagramAccessToken({
        accountId: account.id,
        accessToken: refreshed.accessToken,
        tokenExpiresAt: refreshed.expiresAt,
        tokenLastRefreshedAt: new Date()
      });
      refreshedCount += 1;
    } catch {}
  }

  return refreshedCount;
}

export { getStoredInstagramUserId };
