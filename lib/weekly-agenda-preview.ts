import { createDraftPost, publishPostNow } from "@/lib/posts";
import { getContentBrandProfile, getCurrentWeeklyAgenda } from "@/lib/content-system";
import { generateInstagramCarouselPosts, generateInstagramPost } from "@/lib/openai";
import { renderPostImage } from "@/lib/renderer";
import { getPersistedPreviewUrl, slugify } from "@/lib/storage";
import {
  buildAgendaMessage,
  DEFAULT_BRAND_COLORS,
  inferPostTypeFromFormat,
  inferToneFromAgendaItem
} from "@/lib/weekly-agenda-preview-helpers";
import type { AuthUser } from "@/lib/auth";
import type { InstagramPostType } from "@/lib/instagram";

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
        keywords: item.topicKeywords.join(", "),
        allowSimilarPost: false
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
          imagePath: image.absolutePath,
          previewUrl: getPersistedPreviewUrl(image.publicPath)
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
          imagePath: image.absolutePath,
          previewUrl: getPersistedPreviewUrl(image.publicPath)
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
