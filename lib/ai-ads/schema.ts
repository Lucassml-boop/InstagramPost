import { z } from "zod";

export const trendSchema = z.enum(["rising", "stable", "falling"]);
export const campaignStatusSchema = z.enum(["active", "paused", "learning"]);
export const campaignObjectiveSchema = z.enum(["sales", "leads", "branding", "traffic"]);
export const seasonalitySchema = z.enum(["high", "normal", "low"]);
export const executionModeSchema = z.enum(["manual_review", "safe_auto"]);
export const actionTypeSchema = z.enum([
  "pause",
  "increase_budget",
  "decrease_budget",
  "reallocate_budget",
  "test_new_creative",
  "duplicate_campaign",
  "keep_running"
]);

export const audiencePerformanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  spend: z.number().nonnegative().default(0),
  ctr: z.number().nonnegative().default(0),
  cpa: z.number().nonnegative().nullable().optional(),
  roas: z.number().nonnegative().nullable().optional(),
  conversions: z.number().nonnegative().default(0),
  trend: trendSchema.default("stable")
});

export const creativePerformanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ctr: z.number().nonnegative().default(0),
  frequency: z.number().nonnegative().default(0),
  spend: z.number().nonnegative().default(0),
  trend: trendSchema.default("stable")
});

export const campaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: campaignStatusSchema.default("active"),
  platform: z.string().min(1).default("meta"),
  objective: campaignObjectiveSchema.default("sales"),
  daysActive: z.number().int().nonnegative(),
  budgetDaily: z.number().nonnegative(),
  spend: z.number().nonnegative(),
  impressions: z.number().nonnegative(),
  clicks: z.number().nonnegative(),
  ctr: z.number().nonnegative(),
  cpc: z.number().nonnegative(),
  cpm: z.number().nonnegative(),
  conversions: z.number().nonnegative(),
  cpa: z.number().nonnegative().nullable().optional(),
  roas: z.number().nonnegative().nullable().optional(),
  revenue: z.number().nonnegative().nullable().optional(),
  frequency: z.number().nonnegative(),
  trend: trendSchema.default("stable"),
  ticketAverage: z.number().positive(),
  profitMargin: z.number().positive().max(1),
  stockLevel: z.number().int().nonnegative().nullable().optional(),
  seasonality: seasonalitySchema.default("normal"),
  productName: z.string().min(1).optional(),
  audiences: z.array(audiencePerformanceSchema).default([]),
  creatives: z.array(creativePerformanceSchema).default([])
});

export const businessContextSchema = z.object({
  currency: z.string().min(1).default("BRL"),
  optimizeFor: z.enum(["profit", "revenue", "leads"]).default("profit"),
  targetCpa: z.number().positive(),
  targetRoas: z.number().positive().default(2),
  minimumConversionsForScaling: z.number().int().nonnegative().default(5),
  lowCtrThreshold: z.number().nonnegative().default(1),
  healthyCtrThreshold: z.number().nonnegative().default(1.5),
  minimumSpendForDecision: z.number().nonnegative().default(150),
  lowStockThreshold: z.number().int().nonnegative().default(20)
});

export const safetyRulesSchema = z.object({
  maxBudgetIncreasePct: z.number().positive().max(100).default(30),
  newCampaignFreezeDays: z.number().int().nonnegative().default(3),
  neverPauseAboveConversions: z.number().int().nonnegative().default(20)
});

export const aiAdsAnalysisInputSchema = z.object({
  objective: z.string().min(10),
  executionMode: executionModeSchema.default("manual_review"),
  businessContext: businessContextSchema,
  safetyRules: safetyRulesSchema.default({}),
  campaigns: z.array(campaignSchema).min(1)
});

export type AiAdsAnalysisInput = z.infer<typeof aiAdsAnalysisInputSchema>;
export type ParsedCampaign = z.infer<typeof campaignSchema>;
export type AiAdsActionType = z.infer<typeof actionTypeSchema>;

export type AiAdsAction = {
  type: AiAdsActionType;
  requestedChangePct?: number;
  approvedChangePct?: number;
  reason: string;
  status: "approved" | "blocked" | "watch";
  safetyReason?: string;
};

export type AiAdsCampaignDecision = {
  campaignId: string;
  campaignName: string;
  health: "scale" | "optimize" | "watch" | "risk";
  summary: string;
  findings: string[];
  metrics: {
    spend: number;
    conversions: number;
    ctr: number;
    cpa: number | null;
    roas: number | null;
    revenue: number;
    estimatedProfit: number;
    breakEvenRoas: number | null;
    frequency: number;
  };
  businessSignals: {
    marginPct: number;
    seasonality: z.infer<typeof seasonalitySchema>;
    stockLevel: number | null;
    creativeFatigueRisk: "low" | "medium" | "high";
    bestAudience: string | null;
    weakestAudience: string | null;
  };
  approvedActions: AiAdsAction[];
  blockedActions: AiAdsAction[];
  watchItems: string[];
};

export type AiAdsAnalysisResult = {
  generatedAt: string;
  objective: string;
  executionMode: z.infer<typeof executionModeSchema>;
  summary: {
    totalSpend: number;
    totalRevenue: number;
    estimatedProfit: number;
    campaignsAnalyzed: number;
    scaleCount: number;
    optimizeCount: number;
    riskCount: number;
    blockedActions: number;
  };
  workflow: string[];
  portfolioInsights: string[];
  decisions: AiAdsCampaignDecision[];
  executionPlan: {
    campaignId: string;
    campaignName: string;
    action: AiAdsActionType;
    approvedChangePct?: number;
    mode: z.infer<typeof executionModeSchema>;
    reason: string;
  }[];
  monitoringPlan: string[];
  learningLoop: string[];
};
