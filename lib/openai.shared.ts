import { z } from "zod";
import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import { generatePostSchema } from "@/lib/validators";
import type { BrandProfile } from "@/lib/content-system";

export const ollamaResponseSchema = z.object({
  message: z.object({
    content: z.string().min(1)
  })
});

export const generatedPostSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(3),
  html: z.string().min(1),
  css: z.string().min(1),
  styleGuide: z.string().min(1).optional()
});

export type GeneratePostInput = z.infer<typeof generatePostSchema>;
export type GeneratedPost = z.infer<typeof generatedPostSchema>;
export type AutomationContext = {
  brandProfile?: BrandProfile | null;
};

const DEFAULT_OLLAMA_TIMEOUT_MS = 480_000;
const CAROUSEL_EXTRA_TIMEOUT_PER_SLIDE_MS = 240_000;

function getOllamaTimeoutMs() {
  const rawValue = process.env.OLLAMA_TIMEOUT_MS?.trim();
  if (!rawValue) {
    return DEFAULT_OLLAMA_TIMEOUT_MS;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 1_000) {
    return DEFAULT_OLLAMA_TIMEOUT_MS;
  }
  return parsed;
}

export function getOllamaTimeoutForInput(input: GeneratePostInput) {
  const baseTimeoutMs = getOllamaTimeoutMs();
  return input.postType !== "carousel"
    ? baseTimeoutMs
    : baseTimeoutMs + input.carouselSlideCount * CAROUSEL_EXTRA_TIMEOUT_PER_SLIDE_MS;
}

function normalizeHashtag(tag: string) {
  const trimmed = tag.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function getFallbackModels(primaryModel: string) {
  return (process.env.OLLAMA_FALLBACK_MODELS?.trim() || "")
    .split(",")
    .map((model) => model.trim())
    .filter((model) => Boolean(model) && model !== primaryModel);
}

export function coerceGeneratedPost(raw: unknown): GeneratedPost {
  const parsed = generatedPostSchema.safeParse(raw);
  if (parsed.success) {
    return {
      ...parsed.data,
      hashtags: parsed.data.hashtags.map((tag) => normalizeHashtag(tag) ?? tag)
    };
  }
  if (typeof raw === "object" && raw && "hashtags" in raw) {
    const candidate = raw as {
      caption?: unknown;
      hashtags?: unknown;
      html?: unknown;
      css?: unknown;
    };
    const hashtags =
      typeof candidate.hashtags === "string"
        ? candidate.hashtags.split(/[\s,]+/).map(normalizeHashtag).filter(Boolean)
        : Array.isArray(candidate.hashtags)
          ? candidate.hashtags
              .map((tag) => (typeof tag === "string" ? normalizeHashtag(tag) : null))
              .filter(Boolean)
          : [];
    return generatedPostSchema.parse({
      caption: candidate.caption,
      hashtags,
      html: candidate.html,
      css: candidate.css
    });
  }
  return generatedPostSchema.parse(raw);
}

export function buildPrompt(
  input: GeneratePostInput,
  options?: {
    slideIndex?: number;
    slideCount?: number;
    slideContext?: string;
    styleGuide?: string;
    requireCaption?: boolean;
  },
  automationContext?: AutomationContext
) {
  const keywords = input.keywords?.trim() ? input.keywords.trim() : "none";
  const customInstructions = sanitizeCustomInstructions(input.customInstructions);
  const languageLabel = input.outputLanguage === "pt-BR" ? "Brazilian Portuguese" : "English";
  const postFormat =
    input.postType === "story"
      ? "a vertical 1080x1920 Instagram Story"
      : "a square 1080x1080 Instagram post";
  const slideIndex = options?.slideIndex ?? 1;
  const slideCount = options?.slideCount ?? 1;
  const slideContext = options?.slideContext?.trim() || "No extra context provided.";
  const styleGuide = options?.styleGuide?.trim();
  const requireCaption = options?.requireCaption ?? true;

  return [
    customInstructions || "You are an expert Instagram content strategist and visual designer.",
    "Return only valid JSON with the keys caption, hashtags, html, css, and styleGuide.",
    "Do not wrap the JSON in markdown or add any commentary.",
    `Write the caption and every visible piece of text inside the HTML in ${languageLabel}.`,
    "Requirements:",
    requireCaption
      ? `- caption: persuasive Instagram caption in ${languageLabel}, 2 to 4 short paragraphs, no emojis unless highly relevant`
      : "- caption: a concise caption string; if this is a supporting carousel slide, you may return the same caption logic as the first slide or a concise variant",
    requireCaption ? "- hashtags: array with 6 to 10 relevant Instagram hashtags" : "- hashtags: array with 3 to 10 relevant Instagram hashtags",
    `- html: semantic markup for ${postFormat} inside a single root <section>`,
    `- css: complete CSS for the HTML, optimized for ${postFormat}`,
    "- styleGuide: a compact 2 to 4 sentence description of the visual system so follow-up slides can match the same art direction",
    "- avoid external assets, web fonts, scripts, and SVG data URLs",
    "- use only the brand colors provided when possible",
    input.postType === "carousel"
      ? `- this is slide ${slideIndex} of ${slideCount} in an Instagram carousel`
      : "- this is a single standalone post",
    styleGuide
      ? `- match this established visual direction exactly: ${styleGuide}`
      : "- establish a distinctive but reusable visual direction that later slides can follow",
    "",
    `Topic: ${input.topic}`,
    `Message: ${input.message}`,
    `Slide context: ${slideContext}`,
    `Tone: ${input.tone}`,
    `Post type: ${input.postType}`,
    `Output language: ${languageLabel}`,
    `Brand colors: ${input.brandColors}`,
    `Keywords: ${keywords}`,
    automationContext?.brandProfile ? `Brand positioning context: ${automationContext.brandProfile.editableBrief}` : null,
    automationContext?.brandProfile ? `Brand services context: ${automationContext.brandProfile.services.join(", ")}` : null,
    automationContext?.brandProfile ? `Editorial rules context: ${automationContext.brandProfile.contentRules.join(" | ")}` : null,
    automationContext?.brandProfile ? `Preferred research context: ${automationContext.brandProfile.researchQueries.join(" | ")}` : null,
    automationContext?.brandProfile ? `Preferred carousel structure: ${automationContext.brandProfile.carouselDefaultStructure.join(" -> ")}` : null,
    automationContext?.brandProfile ? `Goal presets to stay aligned with: ${(automationContext.brandProfile.goalPresets ?? []).join(" | ")}` : null,
    automationContext?.brandProfile ? `Content type presets to stay aligned with: ${(automationContext.brandProfile.contentTypePresets ?? []).join(" | ")}` : null,
    automationContext?.brandProfile ? `Format presets to stay aligned with: ${(automationContext.brandProfile.formatPresets ?? []).join(" | ")}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutOpeningFence.replace(/\s*```$/, "").trim();
}
