import type { AiAdsAnalysisInput, ParsedCampaign } from "./schema.ts";

export type EnrichedCampaign = {
  campaign: ParsedCampaign;
  cpa: number | null;
  roas: number | null;
  revenue: number;
  estimatedProfit: number;
  breakEvenRoas: number | null;
  creativeFatigueRisk: "low" | "medium" | "high";
  bestAudience: ParsedCampaign["audiences"][number] | null;
  weakestAudience: ParsedCampaign["audiences"][number] | null;
  lowStock: boolean;
  needsCreativeHelp: boolean;
  goodScaleCandidate: boolean;
  highRisk: boolean;
};

export function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return null;
  }

  return numerator / denominator;
}

function getComputedCpa(campaign: ParsedCampaign) {
  if (typeof campaign.cpa === "number") {
    return campaign.cpa;
  }

  return campaign.conversions > 0 ? campaign.spend / campaign.conversions : null;
}

function getComputedRevenue(campaign: ParsedCampaign) {
  if (typeof campaign.revenue === "number") {
    return campaign.revenue;
  }

  if (typeof campaign.roas === "number") {
    return campaign.spend * campaign.roas;
  }

  return campaign.conversions * campaign.ticketAverage;
}

function sortAudienceByPerformance(audiences: ParsedCampaign["audiences"]) {
  return [...audiences].sort((left, right) => {
    const leftScore = (left.roas ?? 0) * 2 + left.conversions - (left.cpa ?? 0) / 10;
    const rightScore = (right.roas ?? 0) * 2 + right.conversions - (right.cpa ?? 0) / 10;
    return rightScore - leftScore;
  });
}

function detectCreativeFatigue(campaign: ParsedCampaign) {
  const weakCreativeCount = campaign.creatives.filter(
    (creative) => creative.frequency >= 2.5 && creative.ctr < campaign.ctr
  ).length;

  if (
    campaign.trend === "falling" &&
    campaign.frequency >= 3 &&
    (campaign.ctr <= 1 || weakCreativeCount > 0)
  ) {
    return "high" as const;
  }

  if (campaign.frequency >= 2.2 || weakCreativeCount > 0) {
    return "medium" as const;
  }

  return "low" as const;
}

export function enrichCampaign(
  campaign: ParsedCampaign,
  input: AiAdsAnalysisInput
): EnrichedCampaign {
  const cpa = getComputedCpa(campaign);
  const revenue = getComputedRevenue(campaign);
  const roas =
    typeof campaign.roas === "number" ? campaign.roas : safeDivide(revenue, campaign.spend);
  const estimatedProfit = revenue * campaign.profitMargin - campaign.spend;
  const breakEvenRoas = safeDivide(1, campaign.profitMargin);
  const rankedAudiences = sortAudienceByPerformance(campaign.audiences);
  const creativeFatigueRisk = detectCreativeFatigue(campaign);
  const lowStock =
    typeof campaign.stockLevel === "number" &&
    campaign.stockLevel <= input.businessContext.lowStockThreshold;
  const needsCreativeHelp =
    campaign.ctr < input.businessContext.lowCtrThreshold || creativeFatigueRisk === "high";
  const goodScaleCandidate =
    campaign.daysActive >= input.safetyRules.newCampaignFreezeDays &&
    campaign.conversions >= input.businessContext.minimumConversionsForScaling &&
    campaign.trend !== "falling" &&
    campaign.ctr >= input.businessContext.healthyCtrThreshold &&
    typeof cpa === "number" &&
    cpa <= input.businessContext.targetCpa &&
    typeof roas === "number" &&
    typeof breakEvenRoas === "number" &&
    roas >= Math.max(input.businessContext.targetRoas, breakEvenRoas) &&
    estimatedProfit > 0 &&
    !lowStock;
  const highRisk =
    campaign.daysActive >= input.safetyRules.newCampaignFreezeDays &&
    campaign.spend >= input.businessContext.minimumSpendForDecision &&
    (estimatedProfit < 0 ||
      (typeof cpa === "number" && cpa > input.businessContext.targetCpa * 1.5));

  return {
    campaign,
    cpa,
    roas: roas === null ? null : round(roas),
    revenue: round(revenue),
    estimatedProfit: round(estimatedProfit),
    breakEvenRoas: breakEvenRoas === null ? null : round(breakEvenRoas),
    creativeFatigueRisk,
    bestAudience: rankedAudiences[0] ?? null,
    weakestAudience: rankedAudiences.at(-1) ?? null,
    lowStock,
    needsCreativeHelp,
    goodScaleCandidate,
    highRisk
  };
}
