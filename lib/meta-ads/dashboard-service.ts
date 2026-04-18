import { AI_ADS_SAMPLE_INPUT, analyzeAiAdsInput, type AiAdsAnalysisInput, type AiAdsAnalysisResult } from "@/lib/ai-ads";
import { requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getMetaAdsSettingsRecord } from "./account-utils";
import { buildAiAdsPayloadFromSnapshots } from "./payload";
import { getMetaAdsSchemaMissingMessage, isMetaAdsSchemaMissingError } from "./prisma-guard";
import type { AiAdsDashboardData } from "./types";

export async function getAiAdsDashboardData(userId: string) {
  let account;
  let latestSync;

  try {
    [account, latestSync] = await Promise.all([
      prisma.metaAdsAccount.findUnique({ where: { userId } }),
      prisma.metaAdsSyncRun.findFirst({ where: { userId }, orderBy: { startedAt: "desc" } })
    ]);
  } catch (error) {
    if (isMetaAdsSchemaMissingError(error)) {
      return {
        schemaReady: false,
        setupMessage: getMetaAdsSchemaMissingMessage(),
        account: null,
        latestSync: null,
        payload: null,
        analysis: null
      } satisfies AiAdsDashboardData;
    }

    throw error;
  }

  if (!account) {
    return {
      schemaReady: true,
      setupMessage: null,
      account: null,
      latestSync: null,
      payload: null,
      analysis: null
    } satisfies AiAdsDashboardData;
  }

  const latestDecision = await prisma.metaAdsDecisionLog.findFirst({
    where: { userId, ...(latestSync ? { syncRunId: latestSync.id } : {}) },
    orderBy: { createdAt: "desc" }
  });

  let payload = latestDecision?.inputPayload as AiAdsAnalysisInput | null;
  let analysis = latestDecision?.analysis as AiAdsAnalysisResult | null;

  if (!payload || !analysis) {
    const latestSnapshots = await prisma.metaAdsCampaignSnapshot.findMany({
      where: latestSync ? { syncRunId: latestSync.id } : { userId },
      orderBy: { syncedAt: "desc" }
    });

    const inferredPayload = buildAiAdsPayloadFromSnapshots(account, latestSnapshots.map((snapshot) => ({
      externalCampaignId: snapshot.externalCampaignId,
      name: snapshot.name,
      objective: snapshot.objective,
      status: snapshot.status,
      platform: snapshot.platform,
      daysActive: snapshot.daysActive,
      budgetDaily: snapshot.budgetDaily,
      spend: snapshot.spend,
      impressions: snapshot.impressions,
      clicks: snapshot.clicks,
      ctr: snapshot.ctr,
      cpc: snapshot.cpc,
      cpm: snapshot.cpm,
      conversions: snapshot.conversions,
      cpa: snapshot.cpa,
      roas: snapshot.roas,
      revenue: snapshot.revenue,
      frequency: snapshot.frequency,
      trend: snapshot.trend,
      ticketAverage: snapshot.ticketAverage,
      profitMargin: snapshot.profitMargin,
      stockLevel: snapshot.stockLevel,
      seasonality: snapshot.seasonality,
      audiences: snapshot.audiences,
      creatives: snapshot.creatives
    })));

    if (inferredPayload) {
      payload = inferredPayload;
      analysis = analyzeAiAdsInput(inferredPayload);
    }
  }

  return {
    schemaReady: true,
    setupMessage: null,
    account: getMetaAdsSettingsRecord(account),
    latestSync: latestSync ? { id: latestSync.id, status: latestSync.status, datePreset: latestSync.datePreset, startedAt: latestSync.startedAt.toISOString(), finishedAt: latestSync.finishedAt?.toISOString() ?? null, campaignsFetched: latestSync.campaignsFetched } : null,
    payload,
    analysis
  } satisfies AiAdsDashboardData;
}

export async function persistAiAdsDecisionLog(input: { userId: string; payload: AiAdsAnalysisInput; analysis: AiAdsAnalysisResult; syncRunId?: string | null; }) {
  let account;

  try {
    account = await prisma.metaAdsAccount.findUnique({ where: { userId: input.userId } });
  } catch (error) {
    if (isMetaAdsSchemaMissingError(error)) {
      return null;
    }

    throw error;
  }

  if (!account) return null;

  return prisma.metaAdsDecisionLog.create({
    data: {
      userId: input.userId,
      metaAdsAccountId: account.id,
      syncRunId: input.syncRunId ?? null,
      objective: input.payload.objective,
      executionMode: input.payload.executionMode,
      inputPayload: input.payload,
      analysis: input.analysis
    }
  });
}

export function getAiAdsDemoPayload() {
  return AI_ADS_SAMPLE_INPUT;
}

export async function assertMetaAdsRuntimeReady() {
  requireEnv("APP_ENCRYPTION_KEY");
}
