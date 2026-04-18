import type { MetaInsightsRow } from "./types";

export function toNumber(value: unknown, divisor = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed / divisor : 0;
}

export function getMinorUnitCurrencyValue(value: unknown) {
  return toNumber(value, 100);
}

export function getDateRangeForPreset(datePreset: string) {
  const normalized = datePreset.trim().toLowerCase();
  const end = new Date();
  const start = new Date(end);

  if (normalized === "last_14d") start.setDate(end.getDate() - 13);
  else if (normalized === "last_30d") start.setDate(end.getDate() - 29);
  else start.setDate(end.getDate() - 6);

  return { since: start, until: end };
}

export function shiftDateRange(range: { since: Date; until: Date }, shiftDays: number) {
  const since = new Date(range.since);
  const until = new Date(range.until);
  since.setDate(since.getDate() - shiftDays);
  until.setDate(until.getDate() - shiftDays);
  return { since, until };
}

export function formatDateForMeta(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPrimaryActionGroups(objective: string) {
  const normalized = objective.toUpperCase();
  if (normalized.includes("LEAD")) {
    return { conversions: ["lead", "omni_lead", "onsite_conversion.lead_grouped"], revenue: [] };
  }

  const purchaseGroups = ["purchase", "omni_purchase", "offsite_conversion.fb_pixel_purchase", "onsite_web_purchase"];
  return { conversions: purchaseGroups, revenue: purchaseGroups };
}

function getActionMetric(items: unknown, acceptedActionTypes: string[]) {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    if (!item || typeof item !== "object") return sum;
    const current = item as { action_type?: unknown; value?: unknown };
    return typeof current.action_type === "string" && acceptedActionTypes.includes(current.action_type)
      ? sum + toNumber(current.value)
      : sum;
  }, 0);
}

function inferRevenueFromPurchaseRoas(purchaseRoas: unknown, spend: number) {
  if (!Array.isArray(purchaseRoas) || purchaseRoas.length === 0) return null;
  const first = purchaseRoas[0] as { value?: unknown } | undefined;
  const roas = toNumber(first?.value);
  return roas ? roas * spend : null;
}

export function parseMetaInsightsRow(rawRow: Record<string, unknown> | null, objective: string, ticketAverage: number) {
  if (!rawRow) {
    return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, cpm: 0, frequency: 0, conversions: 0, revenue: 0, roas: 0, cpa: null, raw: null } satisfies MetaInsightsRow;
  }

  const spend = toNumber(rawRow.spend);
  const groups = getPrimaryActionGroups(objective);
  const conversions = Math.round(getActionMetric(rawRow.actions, groups.conversions));
  const revenueFromActionValues = getActionMetric(rawRow.action_values, groups.revenue);
  const revenueFromRoas = inferRevenueFromPurchaseRoas(rawRow.purchase_roas, spend);
  const revenue = revenueFromActionValues || revenueFromRoas || (conversions > 0 ? conversions * ticketAverage : 0);

  return {
    spend,
    impressions: Math.round(toNumber(rawRow.impressions)),
    clicks: Math.round(toNumber(rawRow.clicks)),
    ctr: toNumber(rawRow.ctr),
    cpc: toNumber(rawRow.cpc),
    cpm: toNumber(rawRow.cpm),
    frequency: toNumber(rawRow.frequency),
    conversions,
    revenue,
    roas: spend > 0 ? revenue / spend : null,
    cpa: conversions > 0 ? spend / conversions : null,
    raw: rawRow
  } satisfies MetaInsightsRow;
}

export function deriveTrend(current: MetaInsightsRow, previous: MetaInsightsRow) {
  if (previous.spend === 0 && current.spend > 0) return "rising" as const;

  const currentScore = current.conversions * 2 + current.ctr + (current.roas ?? 0) - (current.cpa ?? 0) / 40;
  const previousScore = previous.conversions * 2 + previous.ctr + (previous.roas ?? 0) - (previous.cpa ?? 0) / 40;
  const delta = currentScore - previousScore;

  if (delta > 0.5) return "rising" as const;
  if (delta < -0.5) return "falling" as const;
  return "stable" as const;
}

export function getDaysActive(startTime: string | null) {
  if (!startTime) return 0;
  const start = new Date(startTime);
  const diffMs = Date.now() - start.getTime();
  return Number.isFinite(diffMs) && diffMs > 0 ? Math.max(0, Math.floor(diffMs / 86400000)) : 0;
}
