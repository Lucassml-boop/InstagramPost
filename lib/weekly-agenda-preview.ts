import { createDraftPost, publishPostNow } from "@/lib/posts";
import { getContentBrandProfile, getCurrentWeeklyAgenda } from "@/lib/content-system";
import { generateInstagramCarouselPosts, generateInstagramPost } from "@/lib/openai";
import { renderPostImage } from "@/lib/renderer";
import { slugify } from "@/lib/storage";
import type { AuthUser } from "@/lib/auth";
import type { ContentPlanItem } from "@/lib/content-system";
import type { InstagramPostType } from "@/lib/instagram";

const DEFAULT_BRAND_COLORS = "#101828, #d62976, #feda75";

function inferPostTypeFromFormat(format: string): InstagramPostType {
  const normalized = format.toLowerCase();

  if (normalized.includes("story")) {
    return "story";
  }

  if (normalized.includes("carrossel") || normalized.includes("carousel")) {
    return "carousel";
  }

  return "feed";
}

function inferToneFromAgendaItem(item: ContentPlanItem) {
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

function buildAgendaMessage(item: ContentPlanItem, brandBrief: string) {
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

export async function publishWeeklyAgendaPreview(input: {
  user: AuthUser;
  requestOrigin: string;
  selectedDate?: string | null;
}) {
  const [agenda, brandProfile] = await Promise.all([
    getCurrentWeeklyAgenda(),
    getContentBrandProfile()
  ]);

  if (agenda.length === 0) {
    throw new Error("No weekly agenda is available to publish.");
  }

  const filteredAgenda = input.selectedDate
    ? agenda.filter((item) => item.date === input.selectedDate)
    : agenda;

  if (filteredAgenda.length === 0) {
    throw new Error("The selected weekly agenda day was not found.");
  }

  const results: Array<{
    date: string;
    theme: string;
    postType: InstagramPostType;
    postId?: string;
    status: "published" | "failed";
    error?: string;
  }> = [];

  for (const item of filteredAgenda) {
    const postType = inferPostTypeFromFormat(item.format);

    try {
      const generationInput = {
        topic: item.theme,
        message: buildAgendaMessage(item, brandProfile.editableBrief),
        tone: inferToneFromAgendaItem(item),
        postType,
        carouselSlideCount:
          postType === "carousel" ? Math.min(Math.max(item.structure.length, 2), 10) : 3,
        carouselSlideContexts: postType === "carousel" ? item.structure : [],
        outputLanguage:
          input.user.preferredOutputLanguage === "en"
            ? ("en" as const)
            : ("pt-BR" as const),
        customInstructions: input.user.preferredCustomInstructions?.trim() || "",
        brandColors: DEFAULT_BRAND_COLORS,
        keywords: item.topicKeywords.join(", ")
      };

      const generatedCarousel =
        postType === "carousel" ? await generateInstagramCarouselPosts(generationInput) : null;
      const generated = generatedCarousel
        ? {
            caption: generatedCarousel.caption,
            hashtags: generatedCarousel.hashtags,
            html: generatedCarousel.slides[0].html,
            css: generatedCarousel.slides[0].css
          }
        : await generateInstagramPost(generationInput);

      const slidesToRender = generatedCarousel?.slides ?? [generated];
      const renderedImages = [];

      for (const [index, slide] of slidesToRender.entries()) {
        const image = await renderPostImage({
          slug: `${slugify(item.theme)}-${index + 1}`,
          html: slide.html,
          css: slide.css,
          width: 1080,
          height: postType === "story" ? 1920 : 1080
        });

        renderedImages.push(image);
      }

      const draft = await createDraftPost({
        userId: input.user.id,
        topic: item.theme,
        message: generationInput.message,
        tone: generationInput.tone,
        postType,
        brandColors: DEFAULT_BRAND_COLORS,
        keywords: generationInput.keywords,
        caption: generated.caption,
        hashtags: generated.hashtags,
        htmlLayout: JSON.stringify({
          html: generated.html,
          css: generated.css
        }),
        mediaItems: renderedImages.map((image) => ({
          imageUrl: image.publicPath,
          imagePath: image.absolutePath
        })),
        imageUrl: renderedImages[0].publicPath,
        imagePath: renderedImages[0].absolutePath
      });

      await publishPostNow({
        postId: draft.id,
        userId: input.user.id,
        caption: generated.caption,
        postType,
        mediaItems: renderedImages.map((image) => ({
          imageUrl: image.publicPath,
          imagePath: image.absolutePath
        })),
        imageUrl: renderedImages[0].publicPath,
        imagePath: renderedImages[0].absolutePath,
        requestOrigin: input.requestOrigin
      });

      results.push({
        date: item.date,
        theme: item.theme,
        postType,
        postId: draft.id,
        status: "published"
      });
    } catch (error) {
      results.push({
        date: item.date,
        theme: item.theme,
        postType,
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to publish weekly agenda item."
      });
    }
  }

  return {
    total: results.length,
    published: results.filter((item) => item.status === "published").length,
    failed: results.filter((item) => item.status === "failed").length,
    selectedDate: input.selectedDate ?? null,
    results
  };
}
