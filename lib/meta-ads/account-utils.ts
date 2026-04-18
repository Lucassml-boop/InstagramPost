import { decryptValue, encryptValue, hashSensitiveValue } from "@/lib/crypto";
import type { MetaAdsSettingsRecord } from "./types";

export function normalizeAdAccountId(input: string) {
  const normalized = input.trim();

  if (!normalized) {
    throw new Error("Ad account ID is required.");
  }

  return normalized.startsWith("act_") ? normalized : `act_${normalized}`;
}

export function encryptMetaAdsAccountId(adAccountId: string) {
  return {
    hash: hashSensitiveValue(adAccountId),
    encrypted: encryptValue(adAccountId)
  };
}

export function encryptMetaAdsAccessToken(accessToken: string) {
  return encryptValue(accessToken);
}

export function getMetaAdsAccessToken(account: {
  accessToken: string;
  accessTokenIv: string;
  accessTokenTag: string;
}) {
  return decryptValue({
    encrypted: account.accessToken,
    iv: account.accessTokenIv,
    tag: account.accessTokenTag
  });
}

export function getStoredMetaAdsAccountId(account: {
  adAccountId: string | null;
  adAccountIdEncrypted: string | null;
  adAccountIdIv: string | null;
  adAccountIdTag: string | null;
}) {
  if (account.adAccountIdEncrypted && account.adAccountIdIv && account.adAccountIdTag) {
    return decryptValue({
      encrypted: account.adAccountIdEncrypted,
      iv: account.adAccountIdIv,
      tag: account.adAccountIdTag
    });
  }

  return account.adAccountId ?? "";
}

export function getMetaAdsSettingsRecord(account: {
  adAccountId: string | null;
  adAccountIdEncrypted: string | null;
  adAccountIdIv: string | null;
  adAccountIdTag: string | null;
  connected: boolean;
  lastSyncedAt: Date | null;
  defaultTargetCpa: number;
  defaultTargetRoas: number;
  defaultTicketAverage: number;
  defaultProfitMargin: number;
  defaultStockLevel: number | null;
  defaultSeasonality: string | null;
}) {
  return {
    adAccountId: getStoredMetaAdsAccountId(account),
    connected: account.connected,
    hasAccessToken: true,
    lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    targetCpa: account.defaultTargetCpa,
    targetRoas: account.defaultTargetRoas,
    ticketAverage: account.defaultTicketAverage,
    profitMargin: account.defaultProfitMargin,
    stockLevel: account.defaultStockLevel,
    seasonality:
      account.defaultSeasonality === "high" || account.defaultSeasonality === "low"
        ? account.defaultSeasonality
        : "normal"
  } satisfies MetaAdsSettingsRecord;
}
