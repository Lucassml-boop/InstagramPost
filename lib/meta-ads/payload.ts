import {
  aiAdsAnalysisInputSchema,
  type AiAdsAnalysisInput
} from "@/lib/ai-ads";
import type { StoredSnapshotForAnalysis } from "./types";

export function buildAiAdsPayloadFromSnapshots(
  account: {
    defaultTargetCpa: number;
    defaultTargetRoas: number;
    defaultTicketAverage: number;
    defaultProfitMargin: number;
    defaultStockLevel: number | null;
    defaultSeasonality: string | null;
  },
  snapshots: StoredSnapshotForAnalysis[]
) {
  if (snapshots.length === 0) {
    return null;
  }

  return aiAdsAnalysisInputSchema.parse({
    objective: `Maximizar lucro mantendo CPA abaixo de R$${account.defaultTargetCpa} e ROAS acima de ${account.defaultTargetRoas}.`,
    executionMode: "manual_review",
    businessContext: {
      currency: "BRL",
      optimizeFor: "profit",
      targetCpa: account.defaultTargetCpa,
      targetRoas: account.defaultTargetRoas,
      minimumConversionsForScaling: 5,
      lowCtrThreshold: 1,
      healthyCtrThreshold: 1.6,
      minimumSpendForDecision: 150,
      lowStockThreshold: Math.max(10, account.defaultStockLevel ?? 20)
    },
    safetyRules: {
      maxBudgetIncreasePct: 30,
      newCampaignFreezeDays: 3,
      neverPauseAboveConversions: 20
    },
    campaigns: snapshots.map((snapshot) => ({
      id: snapshot.externalCampaignId,
      name: snapshot.name,
      status: snapshot.status === "paused" ? "paused" : snapshot.daysActive < 3 ? "learning" : "active",
      platform: snapshot.platform,
      objective: snapshot.objective.toUpperCase().includes("LEAD") ? "leads" : snapshot.objective.toUpperCase().includes("AWARENESS") ? "branding" : snapshot.objective.toUpperCase().includes("TRAFFIC") ? "traffic" : "sales",
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
      trend: snapshot.trend === "rising" || snapshot.trend === "falling" ? snapshot.trend : "stable",
      ticketAverage: snapshot.ticketAverage || account.defaultTicketAverage,
      profitMargin: snapshot.profitMargin || account.defaultProfitMargin,
      stockLevel: snapshot.stockLevel ?? account.defaultStockLevel,
      seasonality: snapshot.seasonality === "high" || snapshot.seasonality === "low" ? snapshot.seasonality : account.defaultSeasonality === "high" || account.defaultSeasonality === "low" ? account.defaultSeasonality : "normal",
      audiences: Array.isArray(snapshot.audiences) ? snapshot.audiences : [],
      creatives: Array.isArray(snapshot.creatives) ? snapshot.creatives : []
    }))
  }) satisfies AiAdsAnalysisInput;
}
