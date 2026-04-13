import { decryptValue, encryptValue, hashSensitiveValue } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function persistInstagramAccessToken(input: {
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
    const existingForUser = await tx.instagramAccount.findUnique({ where: { userId: input.userId } });
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
        await tx.instagramAccount.delete({ where: { id: existingForUser.id } });
      }
      return tx.instagramAccount.update({
        where: { id: existingForInstagram.id },
        data: { userId: input.userId, ...commonData }
      });
    }

    if (existingForUser) {
      return tx.instagramAccount.update({
        where: { id: existingForUser.id },
        data: commonData
      });
    }

    return tx.instagramAccount.create({
      data: { userId: input.userId, ...commonData }
    });
  });
}

export function getStoredInstagramUserId(account: {
  instagramUserId: string | null;
  instagramUserIdEncrypted: string | null;
  instagramUserIdIv: string | null;
  instagramUserIdTag: string | null;
}) {
  if (account.instagramUserIdEncrypted && account.instagramUserIdIv && account.instagramUserIdTag) {
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
