import { parseJsonOrThrow, parseJsonResponse } from "@/lib/client/http";
import type { AutomaticPostIdea, BrandProfile, ContentPlanItem } from "@/lib/content-system";

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

export async function generateWeeklyAgenda() {
  const response = await fetch("/api/content-system/generate-weekly", {
    method: "POST"
  });

  return parseJsonOrThrow<
    {
      agenda?: ContentPlanItem[];
      currentTopics?: string[];
      error?: string;
    }
  >(response, "Unable to generate the weekly content agenda.");
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
  return parseJsonResponse<{ agenda?: ContentPlanItem[] }>(response);
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
