import { DEFAULT_CAROUSEL_SLIDE_COUNT } from "./constants";
import type {
  CarouselSlideContext,
  DraftResponse,
  MediaItem,
  OutputLanguage,
  PostType,
  StoryCaptionMode,
  Tone
} from "./types";

export function buildDefaultCarouselContext(index: number, count: number) {
  if (index === 0) {
    return "Capa / Hook / Scroll Stopper. Deve parar o usuario no feed, chamar atencao, criar curiosidade e prometer valor.";
  }

  if (index === 1) {
    return "Contexto / Problema. Mostre que voce entende a dor da pessoa. O slide 2 tambem precisa ser forte porque o Instagram pode reutiliza-lo como abertura.";
  }

  if (index === count - 1) {
    return "CTA / Call to Action. Leve a pessoa a agir: salvar, comentar, seguir ou pedir contato.";
  }

  if (index === count - 2) {
    return "Insight / Conclusao. Reforce a mensagem principal e sintetize o aprendizado do carrossel.";
  }

  return `Desenvolvimento / Conteudo. Entregue valor no slide ${index + 1} com dica, passo, explicacao ou tutorial.`;
}

export function createSlideContexts(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `slide-${index + 1}`,
    value: buildDefaultCarouselContext(index, count)
  })) satisfies CarouselSlideContext[];
}

export function normalizeSlideContexts(current: CarouselSlideContext[], count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `slide-${index + 1}`,
    value: current[index]?.value || buildDefaultCarouselContext(index, count)
  })) satisfies CarouselSlideContext[];
}

export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function isPostType(value: unknown): value is PostType {
  return value === "feed" || value === "story" || value === "carousel";
}

export function isOutputLanguage(value: unknown): value is OutputLanguage {
  return value === "en" || value === "pt-BR";
}

export function isStoryCaptionMode(value: unknown): value is StoryCaptionMode {
  return value === "image-only" || value === "with-caption";
}

export function isTone(value: unknown): value is Tone {
  return value === "professional" || value === "casual" || value === "promotional";
}

function normalizeMediaItems(items: unknown[]): MediaItem[] {
  return items
    .filter((item): item is MediaItem => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as {
        imageUrl?: unknown;
        imagePath?: unknown;
        previewUrl?: unknown;
      };

      return (
        typeof candidate.imageUrl === "string" &&
        typeof candidate.imagePath === "string"
      );
    })
    .map((item) => ({
      imageUrl: item.imageUrl,
      imagePath: item.imagePath,
      ...(typeof item.previewUrl === "string" ? { previewUrl: item.previewUrl } : {})
    }))
    .slice(0, 10);
}

export function sanitizeDraft(value: unknown): DraftResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DraftResponse>;

  if (
    typeof candidate.postId !== "string" ||
    !isPostType(candidate.postType) ||
    typeof candidate.imageUrl !== "string" ||
    typeof candidate.imagePath !== "string" ||
    typeof candidate.caption !== "string" ||
    typeof candidate.htmlLayout !== "string" ||
    !Array.isArray(candidate.hashtags) ||
    !Array.isArray(candidate.mediaItems)
  ) {
    return null;
  }

  return {
    postId: candidate.postId,
    postType: candidate.postType,
    imageUrl: candidate.imageUrl,
    imagePath: candidate.imagePath,
    caption: candidate.caption,
    htmlLayout: candidate.htmlLayout,
    hashtags: candidate.hashtags.filter((tag): tag is string => typeof tag === "string"),
    mediaItems: normalizeMediaItems(candidate.mediaItems)
  };
}

export function restoreCarouselContexts(raw: unknown) {
  if (!Array.isArray(raw)) {
    return null;
  }

  const restoredContexts = raw
    .map((item, index) => ({
      id: `slide-${index + 1}`,
      value:
        typeof item === "string"
          ? item
          : buildDefaultCarouselContext(index, DEFAULT_CAROUSEL_SLIDE_COUNT)
    }))
    .slice(0, 10);

  return restoredContexts.length > 0 ? restoredContexts : null;
}
