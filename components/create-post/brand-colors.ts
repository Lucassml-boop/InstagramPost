import type { BrandColorPalette } from "./types";

const BRAND_COLOR_LABEL_PATTERNS = {
  primary: /(cor\s+principal|primary(?:\s+color)?|dominant)/i,
  background: /(cor\s+de\s+fundo|background(?:\s+color)?|base(?:\/neutra)?|neutral\s+base)/i,
  support: /(cor\s+de\s+apoio|support(?:ing)?(?:\s+color)?|secondary(?:\s+color)?|secundaria)/i,
  accent: /(cor\s+de\s+destaque|accent(?:\s+color)?|highlight(?:\s+color)?|cta(?:\s+color)?)/i
} as const;

export function parseBrandColors(value: string): BrandColorPalette {
  const palette: BrandColorPalette = {
    primary: "",
    background: "",
    support: "",
    accent: ""
  };
  const normalized = value.replace(/\r/g, "").trim();

  if (!normalized) {
    return palette;
  }

  const segments = normalized
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const rawValue = segment.includes(":") ? segment.split(":").slice(1).join(":").trim() : "";
    if (!rawValue) {
      continue;
    }

    if (BRAND_COLOR_LABEL_PATTERNS.primary.test(segment)) {
      palette.primary = rawValue;
      continue;
    }

    if (BRAND_COLOR_LABEL_PATTERNS.background.test(segment)) {
      palette.background = rawValue;
      continue;
    }

    if (BRAND_COLOR_LABEL_PATTERNS.support.test(segment)) {
      palette.support = rawValue;
      continue;
    }

    if (BRAND_COLOR_LABEL_PATTERNS.accent.test(segment)) {
      palette.accent = rawValue;
    }
  }

  if (palette.primary || palette.background || palette.support || palette.accent) {
    return palette;
  }

  const fallbackValues = normalized
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    primary: fallbackValues[0] ?? "",
    background: fallbackValues[1] ?? "",
    support: fallbackValues[2] ?? "",
    accent: fallbackValues[3] ?? ""
  };
}

export function serializeBrandColors(palette: BrandColorPalette) {
  return [
    palette.primary ? `Cor principal: ${palette.primary.trim()}` : null,
    palette.background ? `Cor de fundo: ${palette.background.trim()}` : null,
    palette.support ? `Cor de apoio: ${palette.support.trim()}` : null,
    palette.accent ? `Cor de destaque: ${palette.accent.trim()}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function getBrandColorsHistoryLabel(value: string) {
  const palette = parseBrandColors(value);
  const colors = [palette.primary, palette.background, palette.support, palette.accent].filter(Boolean);
  return colors.join(" / ");
}

export function getBrandColorsSwatches(value: string) {
  const palette = parseBrandColors(value);
  return [palette.primary, palette.background, palette.support, palette.accent].filter(Boolean);
}
