import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { generatePostSchema } from "@/lib/validators";
import type { BrandProfile } from "@/lib/content-system";

const ollamaResponseSchema = z.object({
  message: z.object({
    content: z.string().min(1)
  })
});

const generatedPostSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(3),
  html: z.string().min(1),
  css: z.string().min(1),
  styleGuide: z.string().min(1).optional()
});

type GeneratePostInput = z.infer<typeof generatePostSchema>;
type GeneratedPost = z.infer<typeof generatedPostSchema>;
type AutomationContext = {
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
    console.warn("[ollama] Invalid OLLAMA_TIMEOUT_MS value, using default", {
      rawValue,
      fallbackMs: DEFAULT_OLLAMA_TIMEOUT_MS
    });
    return DEFAULT_OLLAMA_TIMEOUT_MS;
  }

  return parsed;
}

export function getOllamaTimeoutForInput(input: GeneratePostInput) {
  const baseTimeoutMs = getOllamaTimeoutMs();

  if (input.postType !== "carousel") {
    return baseTimeoutMs;
  }

  return baseTimeoutMs + input.carouselSlideCount * CAROUSEL_EXTRA_TIMEOUT_PER_SLIDE_MS;
}

function normalizeHashtag(tag: string) {
  const trimmed = tag.trim().replace(/\s+/g, "");

  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function getFallbackModels(primaryModel: string) {
  const rawValue = process.env.OLLAMA_FALLBACK_MODELS?.trim();

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((model) => model.trim())
    .filter((model) => Boolean(model) && model !== primaryModel);
}

function coerceGeneratedPost(raw: unknown): GeneratedPost {
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
        ? candidate.hashtags
            .split(/[\s,]+/)
            .map(normalizeHashtag)
            .filter((tag): tag is string => Boolean(tag))
        : Array.isArray(candidate.hashtags)
          ? candidate.hashtags
              .map((tag) => (typeof tag === "string" ? normalizeHashtag(tag) : null))
              .filter((tag): tag is string => Boolean(tag))
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

function buildPrompt(
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
    requireCaption
      ? "- hashtags: array with 6 to 10 relevant Instagram hashtags"
      : "- hashtags: array with 3 to 10 relevant Instagram hashtags",
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
    automationContext?.brandProfile
      ? `Brand positioning context: ${automationContext.brandProfile.editableBrief}`
      : null,
    automationContext?.brandProfile
      ? `Brand services context: ${automationContext.brandProfile.services.join(", ")}`
      : null,
    automationContext?.brandProfile
      ? `Editorial rules context: ${automationContext.brandProfile.contentRules.join(" | ")}`
      : null,
    automationContext?.brandProfile
      ? `Preferred research context: ${automationContext.brandProfile.researchQueries.join(" | ")}`
      : null,
    automationContext?.brandProfile
      ? `Preferred carousel structure: ${automationContext.brandProfile.carouselDefaultStructure.join(" -> ")}`
      : null,
    automationContext?.brandProfile
      ? `Goal presets to stay aligned with: ${(automationContext.brandProfile.goalPresets ?? []).join(" | ")}`
      : null,
    automationContext?.brandProfile
      ? `Content type presets to stay aligned with: ${(automationContext.brandProfile.contentTypePresets ?? []).join(" | ")}`
      : null,
    automationContext?.brandProfile
      ? `Format presets to stay aligned with: ${(automationContext.brandProfile.formatPresets ?? []).join(" | ")}`
      : null
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJsonPayload(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
    return withoutOpeningFence.replace(/\s*```$/, "").trim();
  }

  return trimmed;
}

async function requestInstagramPostGeneration(
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
  const parsedInput = generatePostSchema.parse(input);
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const primaryModel = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const fallbackModels = getFallbackModels(primaryModel);
  const modelsToTry = [primaryModel, ...fallbackModels];
  const timeoutMs = getOllamaTimeoutForInput(parsedInput);
  const requestStartedAt = Date.now();
  const prompt = buildPrompt(parsedInput, options, automationContext);
  const attemptErrors: string[] = [];

  console.info("[ollama] Starting generation workflow", {
    modelsToTry,
    timeoutMs,
    topic: parsedInput.topic,
    tone: parsedInput.tone,
    postType: parsedInput.postType,
    outputLanguage: parsedInput.outputLanguage,
    hasCustomInstructions: Boolean(parsedInput.customInstructions?.trim()),
    slideIndex: options?.slideIndex ?? 1,
    slideCount: options?.slideCount ?? 1,
    messageLength: parsedInput.message.length,
    brandColors: parsedInput.brandColors,
    keywordsLength: parsedInput.keywords?.length ?? 0
  });

  for (const [index, model] of modelsToTry.entries()) {
    const controller = new AbortController();
    const startedAt = Date.now();
    const timeout = setTimeout(() => {
      console.error("[ollama] Request aborted after timeout", {
        model,
        timeoutMs,
        attempt: index + 1,
        durationMs: Date.now() - startedAt,
        totalDurationMs: Date.now() - requestStartedAt,
        topic: parsedInput.topic,
        tone: parsedInput.tone
      });
      controller.abort();
    }, timeoutMs);

    console.info("[ollama] Starting chat request", {
      model,
      timeoutMs,
      attempt: index + 1,
      totalAttempts: modelsToTry.length
    });

    try {
      const response = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          stream: false,
          format: "json",
          options: {
            temperature: 0.4
          },
          messages: [
            {
              role: "system",
              content:
                "You generate structured Instagram content payloads for direct rendering and publishing."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });

      console.info("[ollama] Received HTTP response", {
        model,
        status: response.status,
        ok: response.ok,
        attempt: index + 1,
        durationMs: Date.now() - startedAt,
        totalDurationMs: Date.now() - requestStartedAt
      });

      const responseText = await response.text();

      console.info("[ollama] Response body received", {
        model,
        status: response.status,
        attempt: index + 1,
        durationMs: Date.now() - startedAt,
        totalDurationMs: Date.now() - requestStartedAt,
        responseTextLength: responseText.length
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${responseText}`.trim());
      }

      const parsedResponse = ollamaResponseSchema.parse(JSON.parse(responseText));

      let content: unknown;
      const jsonPayload = extractJsonPayload(parsedResponse.message.content);

      try {
        content = JSON.parse(jsonPayload);
      } catch {
        throw new Error("Ollama did not return valid JSON content.");
      }

      const generatedPost = coerceGeneratedPost(content);

      console.info("[ollama] Parsed generated post", {
        model,
        attempt: index + 1,
        durationMs: Date.now() - startedAt,
        totalDurationMs: Date.now() - requestStartedAt,
        captionLength: generatedPost.caption.length,
        hashtagsCount: generatedPost.hashtags.length,
        htmlLength: generatedPost.html.length,
        cssLength: generatedPost.css.length
      });

      return generatedPost;
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? `Ollama request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
          : error instanceof Error
            ? error.message
            : String(error);

      attemptErrors.push(`${model}: ${message}`);

      console.error("[ollama] Request failed", {
        model,
        attempt: index + 1,
        totalAttempts: modelsToTry.length,
        durationMs: Date.now() - startedAt,
        totalDurationMs: Date.now() - requestStartedAt,
        timeoutMs,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: message
      });

      if (index === modelsToTry.length - 1) {
        throw new Error(message);
      }

      console.warn("[ollama] Retrying with fallback model", {
        failedModel: model,
        nextModel: modelsToTry[index + 1],
        attempt: index + 1,
        errorMessage: message
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(
    attemptErrors[attemptErrors.length - 1] ?? "Ollama generation failed unexpectedly."
  );
}

export async function generateInstagramPost(
  input: GeneratePostInput,
  automationContext?: AutomationContext
) {
  return requestInstagramPostGeneration(input, undefined, automationContext);
}

export async function generateInstagramCarouselPosts(
  input: GeneratePostInput,
  automationContext?: AutomationContext
) {
  const parsedInput = generatePostSchema.parse(input);
  const slideCount =
    parsedInput.postType === "carousel" ? parsedInput.carouselSlideCount : 1;
  const slideContexts = Array.from({ length: slideCount }, (_, index) => {
    const raw = parsedInput.carouselSlideContexts[index]?.trim();
    return raw || `Slide ${index + 1} should support the same campaign narrative.`;
  });

  const firstSlide = await requestInstagramPostGeneration(parsedInput, {
    slideIndex: 1,
    slideCount,
    slideContext: slideContexts[0],
    requireCaption: true
  }, automationContext);

  const styleGuide =
    firstSlide.styleGuide?.trim() ||
    "Match the first slide's composition, typography rhythm, and color balance closely.";
  const slides: GeneratedPost[] = [firstSlide];

  for (let index = 1; index < slideCount; index += 1) {
    const slide = await requestInstagramPostGeneration(parsedInput, {
      slideIndex: index + 1,
      slideCount,
      slideContext: slideContexts[index],
      styleGuide,
      requireCaption: false
    }, automationContext);

    slides.push({
      ...slide,
      caption: firstSlide.caption,
      hashtags: firstSlide.hashtags,
      styleGuide
    });
  }

  return {
    slides,
    caption: firstSlide.caption,
    hashtags: firstSlide.hashtags
  };
}
import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
