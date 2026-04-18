import type { AiAdsAnalysisInput } from "./schema.ts";

export const AI_ADS_SAMPLE_INPUT: AiAdsAnalysisInput = {
  objective: "Maximizar lucro mantendo CPA abaixo de R$40 e escalar apenas campanhas com margem real positiva.",
  executionMode: "manual_review",
  businessContext: {
    currency: "BRL",
    optimizeFor: "profit",
    targetCpa: 40,
    targetRoas: 2.4,
    minimumConversionsForScaling: 5,
    lowCtrThreshold: 1,
    healthyCtrThreshold: 1.6,
    minimumSpendForDecision: 150,
    lowStockThreshold: 18
  },
  safetyRules: {
    maxBudgetIncreasePct: 30,
    newCampaignFreezeDays: 3,
    neverPauseAboveConversions: 20
  },
  campaigns: [
    {
      id: "cmp_scale_01",
      name: "Meta | Remarketing | Produto Margem Alta",
      status: "active",
      platform: "meta",
      objective: "sales",
      daysActive: 12,
      budgetDaily: 350,
      spend: 2800,
      impressions: 126000,
      clicks: 3024,
      ctr: 2.4,
      cpc: 0.93,
      cpm: 22.22,
      conversions: 76,
      cpa: 36.84,
      roas: 4.6,
      revenue: 12880,
      frequency: 2.1,
      trend: "rising",
      ticketAverage: 220,
      profitMargin: 0.52,
      stockLevel: 94,
      seasonality: "high",
      productName: "Kit Premium",
      audiences: [
        { id: "aud_1", name: "Visitantes 30 dias", spend: 1400, ctr: 2.9, cpa: 31, roas: 5.1, conversions: 45, trend: "rising" },
        { id: "aud_2", name: "Engajados 60 dias", spend: 1400, ctr: 1.8, cpa: 44, roas: 3.2, conversions: 31, trend: "stable" }
      ],
      creatives: [
        { id: "crt_1", name: "UGC prova social", ctr: 2.7, frequency: 1.8, spend: 1700, trend: "rising" },
        { id: "crt_2", name: "Oferta direta", ctr: 1.9, frequency: 2.5, spend: 1100, trend: "stable" }
      ]
    },
    {
      id: "cmp_creative_02",
      name: "Meta | Prospecting | Criativo Saturando",
      status: "active",
      platform: "meta",
      objective: "sales",
      daysActive: 8,
      budgetDaily: 220,
      spend: 1760,
      impressions: 132000,
      clicks: 1188,
      ctr: 0.9,
      cpc: 1.48,
      cpm: 13.33,
      conversions: 22,
      cpa: 80,
      roas: 1.4,
      revenue: 2464,
      frequency: 3.6,
      trend: "falling",
      ticketAverage: 160,
      profitMargin: 0.58,
      stockLevel: 61,
      seasonality: "normal",
      productName: "Plano Growth",
      audiences: [
        { id: "aud_3", name: "Lookalike compradores", spend: 960, ctr: 1.1, cpa: 71, roas: 1.6, conversions: 13, trend: "falling" },
        { id: "aud_4", name: "Interesses amplos", spend: 800, ctr: 0.7, cpa: 94, roas: 1.1, conversions: 9, trend: "falling" }
      ],
      creatives: [
        { id: "crt_3", name: "Estatico depoimento", ctr: 0.8, frequency: 3.7, spend: 1200, trend: "falling" },
        { id: "crt_4", name: "Video comparativo", ctr: 1.1, frequency: 2.9, spend: 560, trend: "stable" }
      ]
    },
    {
      id: "cmp_new_03",
      name: "Meta | Lead Gen | Campanha Nova",
      status: "learning",
      platform: "meta",
      objective: "leads",
      daysActive: 1,
      budgetDaily: 120,
      spend: 120,
      impressions: 10400,
      clicks: 114,
      ctr: 1.1,
      cpc: 1.05,
      cpm: 11.54,
      conversions: 2,
      cpa: 60,
      roas: 1.8,
      revenue: 216,
      frequency: 1.2,
      trend: "stable",
      ticketAverage: 120,
      profitMargin: 0.42,
      stockLevel: 999,
      seasonality: "normal",
      productName: "Lead Magnet",
      audiences: [
        { id: "aud_5", name: "Interesses nichados", spend: 120, ctr: 1.1, cpa: 60, roas: 1.8, conversions: 2, trend: "stable" }
      ],
      creatives: [
        { id: "crt_5", name: "VSL curta", ctr: 1.1, frequency: 1.2, spend: 120, trend: "stable" }
      ]
    }
  ]
};
