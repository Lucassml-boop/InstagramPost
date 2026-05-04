import { z } from "zod";
import { generatePostSchema } from "@/lib/validators";
import type { BrandProfile } from "@/lib/content-system";
export { extractJsonPayload, fixMalformedJSON, parseGeneratedPostJson } from "./openai-json-repair.ts";
export { buildPrompt } from "./openai.prompt.ts";

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
