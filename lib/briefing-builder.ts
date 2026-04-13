export const BRIEFING_BUILDER_MARKER = "[[BRIEFING_BUILDER_V1]]";

export const BRIEFING_FIELD_IDS = [
  "businessSummary",
  "targetAudience",
  "mainObjective",
  "productsOrServices",
  "brandVoice",
  "differentiators",
  "painPoints",
  "contentPillars",
  "ctaPreference",
  "restrictions"
] as const;

export type BriefingFieldId = (typeof BRIEFING_FIELD_IDS)[number];
export type BriefingMode = "guided" | "prompt";
export type BriefingFields = Record<BriefingFieldId, string>;

type StoredBriefingMetadata = {
  mode: BriefingMode;
  fields: BriefingFields;
};

type ParsedStoredInstructions = {
  mode: BriefingMode;
  fields: BriefingFields;
  prompt: string;
};

export function createEmptyBriefingFields(): BriefingFields {
  return {
    businessSummary: "",
    targetAudience: "",
    mainObjective: "",
    productsOrServices: "",
    brandVoice: "",
    differentiators: "",
    painPoints: "",
    contentPillars: "",
    ctaPreference: "",
    restrictions: ""
  };
}

function normalizeBriefingFields(value: unknown): BriefingFields {
  const defaults = createEmptyBriefingFields();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const record = value as Record<string, unknown>;

  return BRIEFING_FIELD_IDS.reduce<BriefingFields>((accumulator, fieldId) => {
    accumulator[fieldId] =
      typeof record[fieldId] === "string" ? record[fieldId].trim() : defaults[fieldId];
    return accumulator;
  }, defaults);
}

export function buildGuidedBriefingPrompt(fields: BriefingFields) {
  const sections = [
    ["Business summary", fields.businessSummary],
    ["Target audience", fields.targetAudience],
    ["Main objective", fields.mainObjective],
    ["Products or services", fields.productsOrServices],
    ["Brand voice", fields.brandVoice],
    ["Differentiators", fields.differentiators],
    ["Pain points to address", fields.painPoints],
    ["Content pillars", fields.contentPillars],
    ["Preferred CTA", fields.ctaPreference],
    ["Restrictions and rules", fields.restrictions]
  ]
    .map(([label, value]) => `${label}: ${value?.trim() || "Not provided."}`)
    .join("\n");

  return [
    "You are an expert Instagram content strategist and visual designer.",
    "Use the following brand briefing as the main operating context for every idea, caption, and visual direction you create.",
    "Keep the content specific, strategic, commercially useful, and aligned with the brand identity described below.",
    "",
    sections
  ].join("\n");
}

export function serializeStoredCustomInstructions(input: {
  mode: BriefingMode;
  fields: BriefingFields;
  prompt: string;
}) {
  const metadata: StoredBriefingMetadata = {
    mode: input.mode,
    fields: normalizeBriefingFields(input.fields)
  };

  return [
    BRIEFING_BUILDER_MARKER,
    JSON.stringify(metadata),
    input.prompt.trim()
  ].join("\n");
}

export function parseStoredCustomInstructions(value: string | null | undefined): ParsedStoredInstructions {
  const defaults: ParsedStoredInstructions = {
    mode: "prompt",
    fields: createEmptyBriefingFields(),
    prompt: value?.trim() || ""
  };

  const trimmed = value?.trim();
  if (!trimmed?.startsWith(BRIEFING_BUILDER_MARKER)) {
    return defaults;
  }

  const [, metadataLine = "", ...promptLines] = trimmed.split("\n");

  try {
    const metadata = JSON.parse(metadataLine) as Partial<StoredBriefingMetadata>;

    return {
      mode: metadata.mode === "guided" ? "guided" : "prompt",
      fields: normalizeBriefingFields(metadata.fields),
      prompt: promptLines.join("\n").trim()
    };
  } catch {
    return defaults;
  }
}

export function sanitizeCustomInstructions(value: string | null | undefined) {
  return parseStoredCustomInstructions(value).prompt;
}
