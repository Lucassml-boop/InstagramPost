import { z } from "zod";
import type { AiAdsAnalysisInput, AiAdsAnalysisResult } from "@/lib/ai-ads";

export const META_ADS_API_VERSION = process.env.META_ADS_API_VERSION?.trim() || "v23.0";
export const META_ADS_BASE_URL = `https://graph.facebook.com/${META_ADS_API_VERSION}`;
export const DEFAULT_SYNC_DATE_PRESET = "last_7d";

export const metaAdsAccountSettingsSchema = z.object({
  adAccountId: z.string().min(3),
  accessToken: z.string().optional().default(""),
  targetCpa: z.number().positive().default(40),
  targetRoas: z.number().positive().default(2.4),
  ticketAverage: z.number().positive().default(150),
  profitMargin: z.number().positive().max(1).default(0.5),
  stockLevel: z.number().int().nonnegative().nullable().default(null),
  seasonality: z.enum(["high", "normal", "low"]).default("normal")
});

export const metaAdsSyncRequestSchema = z.object({
  datePreset: z.string().min(1).default(DEFAULT_SYNC_DATE_PRESET)
});

export type MetaAdsSettingsRecord = {
  adAccountId: string;
  connected: boolean;
  hasAccessToken: boolean;
  lastSyncedAt: string | null;
  targetCpa: number;
  targetRoas: number;
  ticketAverage: number;
  profitMargin: number;
  stockLevel: number | null;
  seasonality: "high" | "normal" | "low";
};

export type MetaCampaignSeed = {
  id: string;
  name: string;
  objective: string;
  status: string;
  dailyBudget: number;
  startTime: string | null;
  updatedTime: string | null;
  rawCampaign: Record<string, unknown>;
};

export type MetaInsightsRow = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  conversions: number;
  revenue: number | null;
  roas: number | null;
  cpa: number | null;
  raw: Record<string, unknown> | null;
};

export type MetaBreakdownItem = {
  id: string;
  name: string;
  spend: number;
  ctr: number;
  cpa: number | null;
  roas: number | null;
  conversions: number;
  trend: "rising" | "stable" | "falling";
};

export type MetaCreativeBreakdownItem = {
  id: string;
  name: string;
  ctr: number;
  frequency: number;
  spend: number;
  trend: "rising" | "stable" | "falling";
};

export type StoredSnapshotForAnalysis = {
  externalCampaignId: string;
  name: string;
  objective: string;
  status: string;
  platform: string;
  daysActive: number;
  budgetDaily: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  cpa: number | null;
  roas: number | null;
  revenue: number | null;
  frequency: number;
  trend: string;
  ticketAverage: number;
  profitMargin: number;
  stockLevel: number | null;
  seasonality: string;
  audiences: unknown;
  creatives: unknown;
};

export type SyncedSnapshotRow = StoredSnapshotForAnalysis & {
  rawCampaign?: unknown;
  rawCurrentInsights?: unknown;
  rawPreviousInsights?: unknown;
};

export type AiAdsDashboardData = {
  schemaReady: boolean;
  setupMessage: string | null;
  account: MetaAdsSettingsRecord | null;
  latestSync: {
    id: string;
    status: string;
    datePreset: string;
    startedAt: string;
    finishedAt: string | null;
    campaignsFetched: number;
  } | null;
  payload: AiAdsAnalysisInput | null;
  analysis: AiAdsAnalysisResult | null;
};
