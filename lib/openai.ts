import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { generatePostSchema } from "@/lib/validators";

const ollamaResponseSchema = z.object({
  message: z.object({
    content: z.string().min(1)
  })
});

const generatedPostSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string().min(1)).min(3),
  html: z.string().min(1),
  css: z.string().min(1)
});

type GeneratePostInput = z.infer<typeof generatePostSchema>;
type GeneratedPost = z.infer<typeof generatedPostSchema>;

const DEFAULT_OLLAMA_TIMEOUT_MS = 120_000;

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

function normalizeHashtag(tag: string) {
  const trimmed = tag.trim().replace(/\s+/g, "");

  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
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

function buildPrompt(input: GeneratePostInput) {
  const keywords = input.keywords?.trim() ? input.keywords.trim() : "none";

  return [
    "You are an expert Instagram content strategist and visual designer.",
    "Return only valid JSON with the keys caption, hashtags, html, and css.",
    "Do not wrap the JSON in markdown or add any commentary.",
    "Requirements:",
    "- caption: persuasive Instagram caption in English, 2 to 4 short paragraphs, no emojis unless highly relevant",
    "- hashtags: array with 6 to 10 relevant Instagram hashtags",
    "- html: semantic markup for a premium 1080x1080 promotional card inside a single root <section>",
    "- css: complete CSS for the HTML, optimized for a square Instagram visual",
    "- avoid external assets, web fonts, scripts, and SVG data URLs",
    "- use only the brand colors provided when possible",
    "",
    `Topic: ${input.topic}`,
    `Message: ${input.message}`,
    `Tone: ${input.tone}`,
    `Brand colors: ${input.brandColors}`,
    `Keywords: ${keywords}`
  ].join("\n");
}

function extractJsonPayload(content: string) {
  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
    return withoutOpeningFence.replace(/\s*```$/, "").trim();
  }

  return trimmed;
}

export async function generateInstagramPost(input: GeneratePostInput) {
  const parsedInput = generatePostSchema.parse(input);
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const timeoutMs = getOllamaTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
          temperature: 0.8
        },
        messages: [
          {
            role: "system",
            content:
              "You generate structured Instagram content payloads for direct rendering and publishing."
          },
          {
            role: "user",
            content: buildPrompt(parsedInput)
          }
        ]
      }),
      signal: controller.signal
    });

    const responseText = await response.text();

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

    return coerceGeneratedPost(content);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Ollama request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
        : error instanceof Error
          ? error.message
          : String(error);

    throw new Error(message);
  } finally {
    clearTimeout(timeout);
  }
}
