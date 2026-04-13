import type { ContentPlanItem } from "@/lib/content-system";
import type { InstagramPostType } from "@/lib/instagram";

export const DEFAULT_BRAND_COLORS = "#101828, #d62976, #feda75";

export function inferPostTypeFromFormat(format: string): InstagramPostType {
  const normalized = format.toLowerCase();

  if (normalized.includes("story")) {
    return "story";
  }

  if (normalized.includes("carrossel") || normalized.includes("carousel")) {
    return "carousel";
  }

  return "feed";
}

export function inferToneFromAgendaItem(item: ContentPlanItem) {
  const combined = `${item.goal} ${item.type} ${item.theme}`.toLowerCase();

  if (
    combined.includes("oferta") ||
    combined.includes("lead") ||
    combined.includes("convers") ||
    combined.includes("cta")
  ) {
    return "promotional" as const;
  }

  if (
    combined.includes("bastidor") ||
    combined.includes("viral") ||
    combined.includes("curiosidade") ||
    combined.includes("reels") ||
    combined.includes("stories")
  ) {
    return "casual" as const;
  }

  return "professional" as const;
}

export function buildAgendaMessage(item: ContentPlanItem, brandBrief: string) {
  return [
    brandBrief,
    `Objetivo: ${item.goal}`,
    `Tipo de conteudo: ${item.type}`,
    `Estrutura: ${item.structure.join(" | ")}`,
    `Legenda base: ${item.caption}`,
    `Ideia visual: ${item.visualIdea}`,
    `CTA: ${item.cta}`
  ].join("\n");
}
