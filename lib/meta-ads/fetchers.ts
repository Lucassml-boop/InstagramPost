import { META_ADS_BASE_URL } from "./types";
import {
  deriveTrend,
  formatDateForMeta,
  getMinorUnitCurrencyValue,
  parseMetaInsightsRow
} from "./insight-helpers";
import type {
  MetaBreakdownItem,
  MetaCampaignSeed,
  MetaCreativeBreakdownItem
} from "./types";

async function metaAdsFetch<T>(path: string, accessToken: string, params?: Record<string, string | undefined>) {
  const url = new URL(`${META_ADS_BASE_URL}/${path.replace(/^\//, "")}`);
  Object.entries(params ?? {}).forEach(([key, value]) => value && url.searchParams.set(key, value));

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const json = (await response.json()) as Record<string, unknown>;

  if (!response.ok || json.error) {
    const error = json.error as { message?: string } | undefined;
    throw new Error(error?.message ?? `Meta Ads request failed for ${path}.`);
  }

  return json as T;
}

async function paginateMetaCollection<T extends Record<string, unknown>>(path: string, accessToken: string, params: Record<string, string | undefined>) {
  const aggregated: T[] = [];
  let nextUrl: string | null = null;

  do {
    let responseJson: { data?: T[]; paging?: { next?: string } };

    if (nextUrl) {
      const response = await fetch(nextUrl, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
      const json = (await response.json()) as Record<string, unknown>;
      if (!response.ok || json.error) throw new Error((json.error as { message?: string } | undefined)?.message ?? "Meta Ads pagination request failed.");
      responseJson = json as { data?: T[]; paging?: { next?: string } };
    } else {
      responseJson = await metaAdsFetch(path, accessToken, params);
    }

    aggregated.push(...(responseJson.data ?? []));
    nextUrl = responseJson.paging?.next ?? null;
  } while (nextUrl && aggregated.length < 200);

  return aggregated;
}

export async function fetchCampaignSeeds(adAccountId: string, accessToken: string) {
  const campaigns = await paginateMetaCollection<Record<string, unknown>>(`${adAccountId}/campaigns`, accessToken, {
    fields: "id,name,status,effective_status,objective,daily_budget,start_time,updated_time",
    limit: "50"
  });

  return campaigns.map((campaign) => ({
    id: String(campaign.id ?? ""),
    name: String(campaign.name ?? "Campaign"),
    objective: String(campaign.objective ?? "OUTCOME_SALES"),
    status: String(campaign.effective_status ?? campaign.status ?? "ACTIVE").toLowerCase(),
    dailyBudget: getMinorUnitCurrencyValue(campaign.daily_budget),
    startTime: typeof campaign.start_time === "string" ? campaign.start_time : null,
    updatedTime: typeof campaign.updated_time === "string" ? campaign.updated_time : null,
    rawCampaign: campaign
  })) satisfies MetaCampaignSeed[];
}

export async function fetchInsightsForEntity(entityId: string, accessToken: string, objective: string, ticketAverage: number, timeRange: { since: Date; until: Date }) {
  const json = await metaAdsFetch<{ data?: Record<string, unknown>[] }>(`${entityId}/insights`, accessToken, {
    fields: "spend,impressions,clicks,ctr,cpc,cpm,frequency,actions,action_values,purchase_roas",
    time_range: JSON.stringify({ since: formatDateForMeta(timeRange.since), until: formatDateForMeta(timeRange.until) }),
    limit: "1"
  });

  return parseMetaInsightsRow(json.data?.[0] ?? null, objective, ticketAverage);
}

export async function fetchAudienceBreakdown(campaignId: string, accessToken: string, objective: string, ticketAverage: number, currentRange: { since: Date; until: Date }, previousRange: { since: Date; until: Date }) {
  const adsets = await paginateMetaCollection<Record<string, unknown>>(`${campaignId}/adsets`, accessToken, { fields: "id,name,effective_status", limit: "20" });
  const breakdown: MetaBreakdownItem[] = [];

  for (const adset of adsets.slice(0, 8)) {
    const id = String(adset.id ?? "");
    if (!id) continue;
    const [current, previous] = await Promise.all([fetchInsightsForEntity(id, accessToken, objective, ticketAverage, currentRange), fetchInsightsForEntity(id, accessToken, objective, ticketAverage, previousRange)]);
    breakdown.push({ id, name: String(adset.name ?? "Audience"), spend: current.spend, ctr: current.ctr, cpa: current.cpa, roas: current.roas, conversions: current.conversions, trend: deriveTrend(current, previous) });
  }

  return breakdown;
}

export async function fetchCreativeBreakdown(campaignId: string, accessToken: string, objective: string, ticketAverage: number, currentRange: { since: Date; until: Date }, previousRange: { since: Date; until: Date }) {
  const ads = await paginateMetaCollection<Record<string, unknown>>(`${campaignId}/ads`, accessToken, { fields: "id,name,creative{id,name}", limit: "20" });
  const breakdown: MetaCreativeBreakdownItem[] = [];

  for (const ad of ads.slice(0, 8)) {
    const id = String(ad.id ?? "");
    if (!id) continue;
    const [current, previous] = await Promise.all([fetchInsightsForEntity(id, accessToken, objective, ticketAverage, currentRange), fetchInsightsForEntity(id, accessToken, objective, ticketAverage, previousRange)]);
    const creative = ad.creative as { name?: unknown } | undefined;
    breakdown.push({ id, name: typeof creative?.name === "string" && creative.name.length > 0 ? creative.name : String(ad.name ?? "Creative"), ctr: current.ctr, frequency: current.frequency, spend: current.spend, trend: deriveTrend(current, previous) });
  }

  return breakdown;
}
