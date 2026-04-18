import { Prisma } from "@prisma/client";
import { analyzeAiAdsInput } from "@/lib/ai-ads";
import { prisma } from "@/lib/prisma";
import { getMetaAdsAccessToken, getMetaAdsSettingsRecord, getStoredMetaAdsAccountId } from "./account-utils";
import { getMetaAdsSchemaMissingMessage, isMetaAdsSchemaMissingError } from "./prisma-guard";
import { requireMetaAdsAccount } from "./account-service";
import { fetchAudienceBreakdown, fetchCampaignSeeds, fetchCreativeBreakdown, fetchInsightsForEntity } from "./fetchers";
import { getDateRangeForPreset, getDaysActive, shiftDateRange, deriveTrend } from "./insight-helpers";
import { buildAiAdsPayloadFromSnapshots } from "./payload";
import { metaAdsSyncRequestSchema, type AiAdsDashboardData, type SyncedSnapshotRow } from "./types";

export async function syncMetaAdsAccount(userId: string, rawInput?: unknown) {
  try {
    const { datePreset } = metaAdsSyncRequestSchema.parse(rawInput ?? {});
    const account = await requireMetaAdsAccount(userId);
    const accessToken = getMetaAdsAccessToken(account);
    const adAccountId = getStoredMetaAdsAccountId(account);
    const currentRange = getDateRangeForPreset(datePreset);
    const previousRange = shiftDateRange(currentRange, 7);
    const syncRun = await prisma.metaAdsSyncRun.create({ data: { userId, metaAdsAccountId: account.id, status: "RUNNING", datePreset } });
    try {
      const campaignSeeds = await fetchCampaignSeeds(adAccountId, accessToken);
      const syncedAt = new Date();
      const snapshotRows: SyncedSnapshotRow[] = [];

      for (const campaign of campaignSeeds) {
        const [currentInsights, previousInsights, audiences, creatives] = await Promise.all([
          fetchInsightsForEntity(campaign.id, accessToken, campaign.objective, account.defaultTicketAverage, currentRange),
          fetchInsightsForEntity(campaign.id, accessToken, campaign.objective, account.defaultTicketAverage, previousRange),
          fetchAudienceBreakdown(campaign.id, accessToken, campaign.objective, account.defaultTicketAverage, currentRange, previousRange),
          fetchCreativeBreakdown(campaign.id, accessToken, campaign.objective, account.defaultTicketAverage, currentRange, previousRange)
        ]);

        snapshotRows.push({
          externalCampaignId: campaign.id,
          name: campaign.name,
          objective: campaign.objective,
          status: campaign.status,
          platform: "meta",
          daysActive: getDaysActive(campaign.startTime),
          budgetDaily: campaign.dailyBudget,
          spend: currentInsights.spend,
          impressions: currentInsights.impressions,
          clicks: currentInsights.clicks,
          ctr: currentInsights.ctr,
          cpc: currentInsights.cpc,
          cpm: currentInsights.cpm,
          conversions: currentInsights.conversions,
          cpa: currentInsights.cpa,
          roas: currentInsights.roas,
          revenue: currentInsights.revenue,
          frequency: currentInsights.frequency,
          trend: deriveTrend(currentInsights, previousInsights),
          ticketAverage: account.defaultTicketAverage,
          profitMargin: account.defaultProfitMargin,
          stockLevel: account.defaultStockLevel,
          seasonality: account.defaultSeasonality ?? "normal",
          audiences,
          creatives,
          rawCampaign: campaign.rawCampaign,
          rawCurrentInsights: currentInsights.raw,
          rawPreviousInsights: previousInsights.raw
        });
      }

      if (snapshotRows.length > 0) {
        await prisma.metaAdsCampaignSnapshot.createMany({
          data: snapshotRows.map((snapshot) => ({
            userId,
            metaAdsAccountId: account.id,
            syncRunId: syncRun.id,
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
            audiences: snapshot.audiences as Prisma.InputJsonValue,
            creatives: snapshot.creatives as Prisma.InputJsonValue,
            rawCampaign: snapshot.rawCampaign as Prisma.InputJsonValue,
            rawCurrentInsights: snapshot.rawCurrentInsights as Prisma.InputJsonValue,
            rawPreviousInsights: snapshot.rawPreviousInsights as Prisma.InputJsonValue,
            syncedAt
          }))
        });
      }

      const payload = buildAiAdsPayloadFromSnapshots(account, snapshotRows);
      const analysis = payload ? analyzeAiAdsInput(payload) : null;
      if (payload && analysis) {
        await prisma.metaAdsDecisionLog.create({ data: { userId, metaAdsAccountId: account.id, syncRunId: syncRun.id, objective: payload.objective, executionMode: payload.executionMode, inputPayload: payload, analysis } });
      }

      await prisma.$transaction([
        prisma.metaAdsAccount.update({ where: { id: account.id }, data: { lastSyncedAt: syncedAt } }),
        prisma.metaAdsSyncRun.update({ where: { id: syncRun.id }, data: { status: "SUCCEEDED", finishedAt: new Date(), campaignsFetched: snapshotRows.length, rawSummary: { adAccountId, datePreset, campaignsFetched: snapshotRows.length } } })
      ]);

      return {
        schemaReady: true,
        setupMessage: null,
        account: { ...getMetaAdsSettingsRecord(account), lastSyncedAt: syncedAt.toISOString() },
        latestSync: { id: syncRun.id, status: "SUCCEEDED", datePreset, startedAt: syncRun.startedAt.toISOString(), finishedAt: new Date().toISOString(), campaignsFetched: snapshotRows.length },
        payload,
        analysis
      } satisfies AiAdsDashboardData;
    } catch (error) {
      await prisma.metaAdsSyncRun.update({ where: { id: syncRun.id }, data: { status: "FAILED", finishedAt: new Date(), rawSummary: { error: error instanceof Error ? error.message : String(error) } } });
      throw error;
    }
  } catch (error) {
    if (isMetaAdsSchemaMissingError(error)) {
      throw new Error(getMetaAdsSchemaMissingMessage());
    }

    if (error instanceof Error && error.message.includes("Configure a conta Meta Ads")) {
      throw error;
    }

    throw error;
  }
}
