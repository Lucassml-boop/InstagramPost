import { parseJsonOrThrow } from "@/lib/client/http";
import type { AiAdsAnalysisInput, AiAdsAnalysisResult } from "@/lib/ai-ads";
import type { AiAdsDashboardData } from "@/lib/meta-ads";

export async function analyzeAiAds(input: AiAdsAnalysisInput) {
  const response = await fetch("/api/ai-ads/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok?: boolean; analysis?: AiAdsAnalysisResult; error?: string }>(
    response,
    "Unable to analyze AI Ads payload."
  );
}

export async function fetchAiAdsDashboard() {
  const response = await fetch("/api/ai-ads/latest", {
    cache: "no-store"
  });

  return parseJsonOrThrow<AiAdsDashboardData & { ok?: boolean; error?: string }>(
    response,
    "Unable to load AI Ads dashboard."
  );
}

export async function saveMetaAdsSettings(input: {
  adAccountId: string;
  accessToken: string;
  targetCpa: number;
  targetRoas: number;
  ticketAverage: number;
  profitMargin: number;
  stockLevel: number | null;
  seasonality: "high" | "normal" | "low";
}) {
  const response = await fetch("/api/ai-ads/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{
    ok?: boolean;
    error?: string;
    account?: AiAdsDashboardData["account"];
  }>(
    response,
    "Unable to save Meta Ads settings."
  );
}

export async function syncMetaAds(input?: { datePreset?: string }) {
  const response = await fetch("/api/ai-ads/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input ?? {})
  });

  return parseJsonOrThrow<AiAdsDashboardData & { ok?: boolean; error?: string }>(
    response,
    "Unable to sync Meta Ads data."
  );
}
