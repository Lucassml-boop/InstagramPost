import { parseJsonOrThrow, parseJsonResponse } from "@/lib/client/http";
import type { AutomaticPostIdea, BrandProfile } from "@/lib/content-system";
import type { WeeklyAgendaUsageSummary } from "@/lib/content-system.agenda-metadata";
import type {
  ContentPlanItemWithStatus,
  WeeklyPostSummary
} from "@/lib/content-system.agenda-status";

export async function saveBrandProfile(profile: BrandProfile) {
  const response = await fetch("/api/content-system/brand-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });

  return parseJsonOrThrow<{ profile?: BrandProfile; error?: string }>(
    response,
    "Unable to save content automation settings."
  );
}

export async function saveBrandProfileWithAgenda(profile: BrandProfile) {
  const response = await fetch("/api/content-system/brand-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });

  return parseJsonOrThrow<{
    profile?: BrandProfile;
    agenda?: ContentPlanItemWithStatus[];
    weekPosts?: WeeklyPostSummary[];
    agendaSummary?: WeeklyAgendaUsageSummary;
    prepared?: number;
    scanned?: number;
    error?: string;
  }>(
    response,
    "Unable to save content automation settings."
  );
}

export async function generateWeeklyAgenda() {
  // AbortController com timeout de 30 minutos para gerar agenda (pode ser longa)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000);

  try {
    const response = await fetch("/api/content-system/generate-weekly", {
      method: "POST",
      signal: controller.signal
    });

    return parseJsonOrThrow<
      {
        agenda?: ContentPlanItemWithStatus[];
        weekPosts?: WeeklyPostSummary[];
        agendaSummary?: WeeklyAgendaUsageSummary;
        currentTopics?: string[];
        prepared?: number;
        scanned?: number;
        error?: string;
      }
    >(response, "Unable to generate the weekly content agenda.");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Geração de agenda excedeu o tempo limite de 30 minutos. Tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateAutomaticPostIdea(input: {
  profile: BrandProfile;
  day: string;
  postIndex: number;
}) {
  const response = await fetch("/api/content-system/generate-post-idea", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ idea?: AutomaticPostIdea; error?: string }>(
    response,
    "Unable to generate automatic post idea."
  );
}

export async function generateAutomaticSetting(input: {
  profile: BrandProfile;
  target:
    | "brandName"
    | "editableBrief"
    | "services"
    | "contentRules"
    | "researchQueries"
    | "carouselDefaultStructure"
    | "goalPresets"
    | "contentTypePresets"
    | "formatPresets"
    | "customInstructions";
  currentValue: string;
}) {
  const response = await fetch("/api/content-system/generate-setting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ value?: string; error?: string }>(
    response,
    "Unable to generate automatic setting."
  );
}

export async function generateAutomaticSettingsBundle(input: {
  profile: BrandProfile;
  customInstructions: string;
}) {
  const response = await fetch("/api/content-system/generate-settings-bundle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<
    {
      brandName?: string;
      editableBrief?: string;
      services?: string;
      contentRules?: string;
      researchQueries?: string;
      carouselDefaultStructure?: string;
      goalPresets?: string;
      contentTypePresets?: string;
      formatPresets?: string;
      customInstructions?: string;
      error?: string;
    }
  >(response, "Unable to generate automatic settings bundle.");
}

export async function fetchTopicsHistory() {
  const response = await fetch("/api/content-system/topics-history");
  return parseJsonResponse<{ topicsHistory?: string[] }>(response);
}

export async function clearTopicsHistory() {
  const response = await fetch("/api/content-system/topics-history", {
    method: "DELETE"
  });

  return parseJsonOrThrow<{ topicsHistory?: string[]; error?: string }>(
    response,
    "Unable to clear the topic history."
  );
}

export async function fetchAgenda() {
  const response = await fetch("/api/content-system/agenda");
  return parseJsonResponse<{
    agenda?: ContentPlanItemWithStatus[];
    agendaSummary?: WeeklyAgendaUsageSummary;
  }>(response);
}

export async function clearAgenda() {
  const response = await fetch("/api/content-system/agenda", {
    method: "DELETE"
  });

  return parseJsonOrThrow<{
    profile?: BrandProfile;
    agenda?: ContentPlanItemWithStatus[];
    weekPosts?: WeeklyPostSummary[];
    agendaSummary?: WeeklyAgendaUsageSummary;
    error?: string;
  }>(response, "Unable to clear the weekly agenda.");
}

export async function keepUsingStaleAgenda() {
  const response = await fetch("/api/content-system/agenda-resolution", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution: "KEEP_UNUSED" })
  });

  return parseJsonOrThrow<{ ok: true; agendaSummary?: WeeklyAgendaUsageSummary; error?: string }>(
    response,
    "Unable to keep the previous weekly agenda."
  );
}

export async function runAutomationAction(input: {
  endpoint: string;
  method: "GET" | "POST";
  body?: string;
}) {
  const response = await fetch(input.endpoint, {
    method: input.method,
    headers: input.body ? { "Content-Type": "application/json" } : undefined,
    body: input.body
  });

  const text = await response.text();
  const parsed = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  })();

  return {
    response,
    text,
    parsed,
    formatted: parsed ? JSON.stringify(parsed, null, 2) : text
  };
}
