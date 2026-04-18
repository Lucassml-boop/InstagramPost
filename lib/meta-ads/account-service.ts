import { prisma } from "@/lib/prisma";
import {
  encryptMetaAdsAccessToken,
  encryptMetaAdsAccountId,
  getMetaAdsSettingsRecord
} from "./account-utils";
import { getMetaAdsSchemaMissingMessage, isMetaAdsSchemaMissingError } from "./prisma-guard";
import { metaAdsAccountSettingsSchema } from "./types";

export async function saveMetaAdsAccountSettings(userId: string, rawInput: unknown) {
  const input = metaAdsAccountSettingsSchema.parse(rawInput);
  const normalizedId = input.adAccountId.trim().startsWith("act_") ? input.adAccountId.trim() : `act_${input.adAccountId.trim()}`;
  const encryptedAdAccountId = encryptMetaAdsAccountId(normalizedId);

  try {
    return await prisma.$transaction(async (tx) => {
      const existingForUser = await tx.metaAdsAccount.findUnique({ where: { userId } });
      const existingForAccount = await tx.metaAdsAccount.findUnique({ where: { adAccountIdHash: encryptedAdAccountId.hash } });
      const nextEncryptedToken =
        input.accessToken && input.accessToken.trim().length >= 20
          ? encryptMetaAdsAccessToken(input.accessToken.trim())
          : existingForUser
            ? { encrypted: existingForUser.accessToken, iv: existingForUser.accessTokenIv, tag: existingForUser.accessTokenTag }
            : existingForAccount
              ? { encrypted: existingForAccount.accessToken, iv: existingForAccount.accessTokenIv, tag: existingForAccount.accessTokenTag }
              : null;

      if (!nextEncryptedToken) throw new Error("Access token is required the first time you connect Meta Ads.");

      const commonData = {
        adAccountId: null,
        adAccountIdHash: encryptedAdAccountId.hash,
        adAccountIdEncrypted: encryptedAdAccountId.encrypted.encrypted,
        adAccountIdIv: encryptedAdAccountId.encrypted.iv,
        adAccountIdTag: encryptedAdAccountId.encrypted.tag,
        accessToken: nextEncryptedToken.encrypted,
        accessTokenIv: nextEncryptedToken.iv,
        accessTokenTag: nextEncryptedToken.tag,
        connected: true,
        defaultTargetCpa: input.targetCpa,
        defaultTargetRoas: input.targetRoas,
        defaultTicketAverage: input.ticketAverage,
        defaultProfitMargin: input.profitMargin,
        defaultStockLevel: input.stockLevel,
        defaultSeasonality: input.seasonality
      };

      if (existingForAccount) {
        if (existingForUser && existingForUser.id !== existingForAccount.id) {
          await tx.metaAdsAccount.delete({ where: { id: existingForUser.id } });
        }
        return tx.metaAdsAccount.update({ where: { id: existingForAccount.id }, data: { userId, ...commonData } });
      }

      if (existingForUser) {
        return tx.metaAdsAccount.update({ where: { id: existingForUser.id }, data: commonData });
      }

      return tx.metaAdsAccount.create({ data: { userId, ...commonData } });
    });
  } catch (error) {
    if (isMetaAdsSchemaMissingError(error)) {
      throw new Error(getMetaAdsSchemaMissingMessage());
    }

    throw error;
  }
}

export async function getMetaAdsAccountSettings(userId: string) {
  try {
    const account = await prisma.metaAdsAccount.findUnique({ where: { userId } });
    return account ? getMetaAdsSettingsRecord(account) : null;
  } catch (error) {
    if (isMetaAdsSchemaMissingError(error)) {
      return null;
    }

    throw error;
  }
}

export async function requireMetaAdsAccount(userId: string) {
  let account;

  try {
    account = await prisma.metaAdsAccount.findUnique({ where: { userId } });
  } catch (error) {
    if (isMetaAdsSchemaMissingError(error)) {
      throw new Error(getMetaAdsSchemaMissingMessage());
    }

    throw error;
  }

  if (!account) throw new Error("Configure a conta Meta Ads antes de sincronizar.");
  return account;
}
