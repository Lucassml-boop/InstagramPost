import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import type { AutomationContext, GeneratePostInput } from "./openai.shared.ts";

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
  const primaryContext = [userTopicHint ?? "", input.topic, input.message, input.keywords ?? "", slideContext].join(" ");
  const profile = automationContext?.brandProfile;
  const relevantServices = profile ? pickRelevantItems(profile.services, primaryContext, 4) : [];
  const relevantRules = profile ? pickRelevantItems(profile.contentRules, primaryContext, 5) : [];
  const relevantResearchQueries = profile ? pickRelevantItems(profile.researchQueries, primaryContext, 4) : [];
  const relevantGoalPresets = profile ? pickRelevantItems(profile.goalPresets ?? [], primaryContext, 3) : [];
  const relevantContentTypePresets = profile ? pickRelevantItems(profile.contentTypePresets ?? [], primaryContext, 4) : [];
  const relevantFormatPresets = profile ? pickRelevantItems(profile.formatPresets ?? [], primaryContext, 4) : [];

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
    input.postType === "carousel" ? `- this is slide ${slideIndex} of ${slideCount} in an Instagram carousel` : "- this is a single standalone post",
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
    profile ? `Brand positioning context: ${profile.editableBrief}` : null,
    profile ? `Most relevant brand services context: ${(relevantServices.length > 0 ? relevantServices : profile.services).join(", ")}` : null,
    profile ? `Most relevant editorial rules context: ${(relevantRules.length > 0 ? relevantRules : profile.contentRules).join(" | ")}` : null,
    profile ? `Most relevant research context: ${(relevantResearchQueries.length > 0 ? relevantResearchQueries : profile.researchQueries).join(" | ")}` : null,
    profile ? `Preferred carousel structure: ${profile.carouselDefaultStructure.join(" -> ")}` : null,
    profile ? `Goal presets to stay aligned with: ${(relevantGoalPresets.length > 0 ? relevantGoalPresets : profile.goalPresets ?? []).join(" | ")}` : null,
    profile ? `Content type presets to stay aligned with: ${(relevantContentTypePresets.length > 0 ? relevantContentTypePresets : profile.contentTypePresets ?? []).join(" | ")}` : null,
    profile ? `Format presets to stay aligned with: ${(relevantFormatPresets.length > 0 ? relevantFormatPresets : profile.formatPresets ?? []).join(" | ")}` : null
  ]
    .filter(Boolean)
    .join("\n");
}
