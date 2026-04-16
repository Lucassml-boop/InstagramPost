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

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreItemAgainstContext(item: string, context: string) {
  const normalizedItem = normalizeForMatch(item);
  const normalizedContext = normalizeForMatch(context);
  if (!normalizedItem || !normalizedContext) {
    return 0;
  }

  return normalizedItem
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .reduce((score, token) => (normalizedContext.includes(token) ? score + 1 : score), 0);
}

function pickRelevantItems(items: string[], context: string, limit = 4) {
  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreItemAgainstContext(item, context)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    })
    .slice(0, Math.min(limit, items.length))
    .map((entry) => entry.item);
}

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

function stripCarouselPaginationLabels(html: string) {
  const patterns = [
    /\b(?:slide|slideshow|serie|s[eé]rie|pagina|p[aá]gina|page|part)\s*\d+\s*(?:\/|de|of)\s*\d+\b/gi,
    /\b\d+\s*(?:\/|de|of)\s*\d+\b/gi
  ];

  let sanitizedHtml = html;

  for (const pattern of patterns) {
    sanitizedHtml = sanitizedHtml.replace(pattern, "");
  }

  sanitizedHtml = sanitizedHtml
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();

  return sanitizedHtml;
}

export function sanitizeGeneratedPost(
  generated: GeneratedPost,
  input: Pick<GeneratePostInput, "postType">
) {
  if (input.postType !== "carousel") {
    return generated;
  }

  return {
    ...generated,
    html: stripCarouselPaginationLabels(generated.html)
  };
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
  const userTopicHint = input.userTopicHint?.trim();
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
  const primaryContext = [
    userTopicHint ?? "",
    input.topic,
    input.message,
    input.keywords ?? "",
    slideContext
  ].join(" ");
  const relevantServices = automationContext?.brandProfile
    ? pickRelevantItems(automationContext.brandProfile.services, primaryContext, 4)
    : [];
  const relevantRules = automationContext?.brandProfile
    ? pickRelevantItems(automationContext.brandProfile.contentRules, primaryContext, 5)
    : [];
  const relevantResearchQueries = automationContext?.brandProfile
    ? pickRelevantItems(automationContext.brandProfile.researchQueries, primaryContext, 4)
    : [];
  const relevantGoalPresets = automationContext?.brandProfile
    ? pickRelevantItems(automationContext.brandProfile.goalPresets ?? [], primaryContext, 3)
    : [];
  const relevantContentTypePresets = automationContext?.brandProfile
    ? pickRelevantItems(automationContext.brandProfile.contentTypePresets ?? [], primaryContext, 4)
    : [];
  const relevantFormatPresets = automationContext?.brandProfile
    ? pickRelevantItems(automationContext.brandProfile.formatPresets ?? [], primaryContext, 4)
    : [];

  return [
    customInstructions || "You are an expert Instagram content strategist and visual designer.",
    "Return only valid JSON with the keys caption, hashtags, html, css, and styleGuide.",
    "Do not wrap the JSON in markdown or add any commentary.",
    `Write the caption and every visible piece of text inside the HTML in ${languageLabel}.`,
    "The explicit user focus, Topic, Message, Keywords, and Slide context are the highest-priority instructions.",
    "Use the broader brand strategy only as supporting context.",
    "Do not collapse different business angles into one repeated theme if the user requested something more specific.",
    "Requirements:",
    requireCaption
      ? `- caption: persuasive Instagram caption in ${languageLabel}, 2 to 4 short paragraphs, no emojis unless highly relevant`
      : "- caption: a concise caption string; if this is a supporting carousel slide, you may return the same caption logic as the first slide or a concise variant",
    requireCaption ? "- hashtags: array with 6 to 10 relevant Instagram hashtags" : "- hashtags: array with 3 to 10 relevant Instagram hashtags",
    `- html: semantic markup for ${postFormat} inside a single root <section>`,
    `- css: complete CSS for the HTML, optimized for ${postFormat}`,
    "- styleGuide: a compact 2 to 4 sentence description of the visual system so follow-up slides can match the same art direction",
    "- avoid external assets, web fonts, scripts, and SVG data URLs",
    "- use the brand colors provided according to their roles whenever possible: primary for dominant areas, background for the base, support for secondary elements, accent for CTAs or emphasis",
    input.postType === "carousel"
      ? "- never show pagination, progress markers, or slide counters inside the artwork; do not render labels like 1/3, 2 of 5, slide 1, page 2, or serie 1/3"
      : null,
    input.postType === "carousel"
      ? `- this is slide ${slideIndex} of ${slideCount} in an Instagram carousel`
      : "- this is a single standalone post",
    styleGuide
      ? `- match this established visual direction exactly: ${styleGuide}`
      : "- establish a distinctive but reusable visual direction that later slides can follow",
    "",
    `Explicit user focus: ${userTopicHint || "none"}`,
    `Topic: ${input.topic}`,
    `Message: ${input.message}`,
    `Slide context: ${slideContext}`,
    `Tone: ${input.tone}`,
    `Post type: ${input.postType}`,
    `Output language: ${languageLabel}`,
    `Brand colors: ${input.brandColors}`,
    `Keywords: ${keywords}`,
    automationContext?.brandProfile ? `Brand positioning context: ${automationContext.brandProfile.editableBrief}` : null,
    automationContext?.brandProfile ? `Most relevant brand services context: ${(relevantServices.length > 0 ? relevantServices : automationContext.brandProfile.services).join(", ")}` : null,
    automationContext?.brandProfile ? `Most relevant editorial rules context: ${(relevantRules.length > 0 ? relevantRules : automationContext.brandProfile.contentRules).join(" | ")}` : null,
    automationContext?.brandProfile ? `Most relevant research context: ${(relevantResearchQueries.length > 0 ? relevantResearchQueries : automationContext.brandProfile.researchQueries).join(" | ")}` : null,
    automationContext?.brandProfile ? `Preferred carousel structure: ${automationContext.brandProfile.carouselDefaultStructure.join(" -> ")}` : null,
    automationContext?.brandProfile ? `Goal presets to stay aligned with: ${(relevantGoalPresets.length > 0 ? relevantGoalPresets : automationContext.brandProfile.goalPresets ?? []).join(" | ")}` : null,
    automationContext?.brandProfile ? `Content type presets to stay aligned with: ${(relevantContentTypePresets.length > 0 ? relevantContentTypePresets : automationContext.brandProfile.contentTypePresets ?? []).join(" | ")}` : null,
    automationContext?.brandProfile ? `Format presets to stay aligned with: ${(relevantFormatPresets.length > 0 ? relevantFormatPresets : automationContext.brandProfile.formatPresets ?? []).join(" | ")}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Tenta corrigir JSON malformado comum gerado por LLMs
 * - Remove quebras de linha não escapadas dentro de strings
 * - Remove comentários JSON5
 * - Adiciona aspas faltantes em propriedades
 */
export function fixMalformedJSON(jsonString: string): string {
  let fixed = jsonString;

  // Remove comentários JSON5 (// e /* */)
  fixed = fixed
    .replace(/\/\/.*?$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Tenta corrigir quebras de linha não escapadas em strings
  // Procura por padrões como: "...conteúdo\nconteúdo..." e os corrige
  fixed = fixed.replace(
    /"([^"]*(?:\\.[^"]*)*)":/g,
    (match, content) => {
      // Escapar quebras de linha e caracteres de controle dentro do valor
      const escaped = content
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return `"${escaped}":`;
    }
  );

  // Corrigir valores de string com quebras de linha
  fixed = fixed.replace(
    /:\s*"([^"]*(?:\\.[^"]*)*)"/g,
    (match, content) => {
      const escaped = content
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      return `: "${escaped}"`;
    }
  );

  // Remover espaços em branco desnecessários entre chaves/colchetes e vírgulas
  fixed = fixed
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*]\s*/g, "]");

  return fixed;
}

export function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }
  const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
  return withoutOpeningFence.replace(/\s*```$/, "").trim();
}
