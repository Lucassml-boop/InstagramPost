import { z } from "zod";
import { jsonError } from "../server-utils.ts";
import type { BrandProfile } from "../content-system.ts";
import type {
  SimilarManualPostMatch,
  SimilarManualPostResult
} from "../posts.ts";
import { generatePostSchema, publishPostSchema } from "../validators.ts";

type AuthUser = {
  id: string;
};

type GeneratePostInput = z.infer<typeof generatePostSchema>;

type GeneratePostDeps = {
  generateInstagramPost: (input: GeneratePostInput, automationContext?: { brandProfile?: BrandProfile | null }) => Promise<{
    caption: string;
    hashtags: string[];
    html: string;
    css: string;
  }>;
  generateInstagramCarouselPosts: (input: GeneratePostInput, automationContext?: { brandProfile?: BrandProfile | null }) => Promise<{
    caption: string;
    hashtags: string[];
    slides: Array<{ html: string; css: string }>;
  }>;
  getContentBrandProfile?: () => Promise<BrandProfile>;
  renderPostImage: (input: {
    slug: string;
    html: string;
    css: string;
    width: number;
    height: number;
  }) => Promise<{ publicPath: string; absolutePath: string }>;
  getPersistedPreviewUrl: (imageUrl: string) => string;
  createDraftPost: (input: {
    userId: string;
    topic: string;
    message: string;
    tone: string;
    postType: "feed" | "story" | "carousel";
    brandColors: string;
    keywords?: string;
    caption: string;
    hashtags: string[];
    htmlLayout: string;
    mediaItems: Array<{ imageUrl: string; imagePath: string; previewUrl?: string }>;
    imageUrl: string;
    imagePath: string;
  }) => Promise<{ id: string; imageUrl: string; imagePath: string; htmlLayout: string }>;
  findSimilarManualPost?: (input: {
    userId: string;
    topic: string;
    message: string;
    keywords?: string;
  }) => Promise<SimilarManualPostResult | null>;
  slugify: (value: string) => string;
};

type PublishPostDeps = {
  publishPostNow: (input: {
    postId: string;
    userId: string;
    caption: string;
    postType?: "feed" | "story" | "carousel";
    mediaItems?: Array<{ imageUrl: string; imagePath: string; previewUrl?: string }>;
    imageUrl?: string;
    imagePath?: string;
    requestOrigin?: string;
  }) => Promise<{ id: string }>;
};

async function getDefaultGeneratePostDeps(): Promise<GeneratePostDeps> {
  const [{ createDraftPost, findSimilarManualPost }, openai, { renderPostImage }, { getPersistedPreviewUrl, slugify }, contentSystem] =
    await Promise.all([
    import("../posts.ts"),
    import("../openai.ts"),
    import("../renderer.ts"),
    import("../storage.ts"),
    import("../content-system.ts")
  ]);

  return {
    createDraftPost,
    findSimilarManualPost,
    generateInstagramPost: openai.generateInstagramPost,
    generateInstagramCarouselPosts: openai.generateInstagramCarouselPosts,
    getContentBrandProfile: contentSystem.getContentBrandProfile,
    renderPostImage,
    getPersistedPreviewUrl,
    slugify
  };
}

async function getDefaultPublishPostDeps(): Promise<PublishPostDeps> {
  const { publishPostNow } = await import("../posts.ts");
  return { publishPostNow };
}

function getSimilarFieldLabel(field: SimilarManualPostMatch["field"]) {
  if (field === "topic") {
    return "Produto ou tema";
  }

  if (field === "message") {
    return "Promocao ou mensagem";
  }

  return "Palavras-chave opcionais";
}

function buildSimilarPostLink(request: Request, postId: string) {
  const url = new URL("/scheduled-posts", request.url);
  url.searchParams.set("highlightPostId", postId);
  return `${url.pathname}${url.search}`;
}

function buildSimilarPostDetails(similarPost: SimilarManualPostResult) {
  return similarPost.matches.map((match) => ({
    field: match.field,
    label: getSimilarFieldLabel(match.field),
    matchType: match.matchType,
    candidateValue: match.candidateValue,
    existingValue: match.existingValue,
    ...(match.overlapKeywords?.length ? { overlapKeywords: match.overlapKeywords } : {})
  }));
}

export async function handleGeneratePost(
  request: Request,
  user: AuthUser | null,
  deps?: GeneratePostDeps
) {
  const startedAt = Date.now();
  const phaseStartedAt = {
    auth: Date.now(),
    ai: 0,
    render: 0,
    draft: 0
  };

  try {
    console.info("[api/posts/generate] Request started");
    console.info("[api/posts/generate] Auth resolved", {
      durationMs: Date.now() - phaseStartedAt.auth,
      totalDurationMs: Date.now() - startedAt,
      isAuthenticated: Boolean(user)
    });

    if (!user) {
      console.warn("[api/posts/generate] Unauthorized request", {
        durationMs: Date.now() - startedAt
      });
      return jsonError("Unauthorized", 401);
    }

    const resolvedDeps = deps ?? (await getDefaultGeneratePostDeps());

    const parsed = generatePostSchema.parse(await request.json());
    const brandProfile = resolvedDeps.getContentBrandProfile
      ? await resolvedDeps.getContentBrandProfile()
      : null;
    console.info("[api/posts/generate] Payload parsed", {
      userId: user.id,
      topic: parsed.topic,
      tone: parsed.tone,
      postType: parsed.postType,
      carouselSlideCount: parsed.carouselSlideCount,
      outputLanguage: parsed.outputLanguage,
      hasCustomInstructions: Boolean(parsed.customInstructions?.trim()),
      hasMessage: Boolean(parsed.message.trim()),
      hasKeywords: Boolean(parsed.keywords?.trim()),
      brandColors: parsed.brandColors
    });

    const similarPost = resolvedDeps.findSimilarManualPost
      && !parsed.allowSimilarPost
      ? await resolvedDeps.findSimilarManualPost({
          userId: user.id,
          topic: parsed.topic,
          message: parsed.message,
          keywords: parsed.keywords
        })
      : null;

    if (similarPost) {
      const errorMessage =
        "Ja existe um post manual muito parecido salvo anteriormente. Revise o post encontrado abaixo para ver exatamente o que ficou igual antes de gerar novamente.";

      return jsonError(errorMessage, 400, {
        errorDetails: {
          type: "similar-manual-post",
          similarPost: {
            id: similarPost.id,
            href: buildSimilarPostLink(request, similarPost.id),
            createdAt: similarPost.createdAt.toISOString(),
            details: buildSimilarPostDetails(similarPost)
          }
        }
      });
    }

    phaseStartedAt.ai = Date.now();
    const generatedCarousel =
      parsed.postType === "carousel"
        ? await resolvedDeps.generateInstagramCarouselPosts(parsed, { brandProfile })
        : null;
    const generated = generatedCarousel
      ? {
          caption: generatedCarousel.caption,
          hashtags: generatedCarousel.hashtags,
          html: generatedCarousel.slides[0].html,
          css: generatedCarousel.slides[0].css
        }
      : await resolvedDeps.generateInstagramPost(parsed, { brandProfile });

    console.info("[api/posts/generate] Text and layout generated", {
      userId: user.id,
      aiDurationMs: Date.now() - phaseStartedAt.ai,
      totalDurationMs: Date.now() - startedAt,
      hashtagsCount: generated.hashtags.length,
      slidesCount: generatedCarousel?.slides.length ?? 1
    });

    phaseStartedAt.render = Date.now();
    const slidesToRender = generatedCarousel?.slides ?? [generated];
    const renderedImages = [];

    for (const [index, slide] of slidesToRender.entries()) {
      const slideRenderStartedAt = Date.now();
      const image = await resolvedDeps.renderPostImage({
        slug: `${resolvedDeps.slugify(parsed.topic)}-${index + 1}`,
        html: slide.html,
        css: slide.css,
        width: 1080,
        height: parsed.postType === "story" ? 1920 : 1080
      });

      console.info("[api/posts/generate] Slide rendered", {
        userId: user.id,
        slideIndex: index + 1,
        slideCount: slidesToRender.length,
        renderDurationMs: Date.now() - slideRenderStartedAt,
        totalRenderDurationMs: Date.now() - phaseStartedAt.render,
        totalDurationMs: Date.now() - startedAt
      });

      renderedImages.push(image);
    }

    phaseStartedAt.draft = Date.now();
    const draft = await resolvedDeps.createDraftPost({
      userId: user.id,
      topic: parsed.topic,
      message: parsed.message,
      tone: parsed.tone,
      postType: parsed.postType,
      brandColors: parsed.brandColors,
      keywords: parsed.keywords,
      caption: generated.caption,
      hashtags: generated.hashtags,
      htmlLayout: JSON.stringify({
        html: generated.html,
        css: generated.css
      }),
      mediaItems: renderedImages.map((image) => ({
        imageUrl: image.publicPath,
        imagePath: image.absolutePath,
        previewUrl: resolvedDeps.getPersistedPreviewUrl(image.publicPath)
      })),
      imageUrl: renderedImages[0].publicPath,
      imagePath: renderedImages[0].absolutePath
    });

    console.info("[api/posts/generate] Draft created", {
      userId: user.id,
      draftDurationMs: Date.now() - phaseStartedAt.draft,
      renderDurationMs: phaseStartedAt.draft - phaseStartedAt.render,
      totalDurationMs: Date.now() - startedAt,
      slidesCount: renderedImages.length
    });

    return Response.json({
      postId: draft.id,
      postType: parsed.postType,
      mediaItems: renderedImages.map((image) => ({
        imageUrl: image.publicPath,
        imagePath: image.absolutePath,
        previewUrl: resolvedDeps.getPersistedPreviewUrl(image.publicPath)
      })),
      imageUrl: draft.imageUrl,
      imagePath: draft.imagePath,
      caption: generated.caption,
      hashtags: generated.hashtags,
      htmlLayout: draft.htmlLayout
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate post.";
    const status = message.includes("timed out after") ? 504 : 400;

    console.error("[api/posts/generate] Request failed", {
      durationMs: Date.now() - startedAt,
      status,
      error: message
    });
    return jsonError(message, status);
  }
}

export async function handlePublishPost(
  request: Request,
  user: AuthUser | null,
  requestOrigin: string,
  deps?: PublishPostDeps
) {
  try {
    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const resolvedDeps = deps ?? (await getDefaultPublishPostDeps());

    const parsed = publishPostSchema.parse(await request.json());
    const post = await resolvedDeps.publishPostNow({
      postId: parsed.postId,
      userId: user.id,
      caption: parsed.caption,
      postType: parsed.postType,
      mediaItems: parsed.mediaItems,
      imageUrl: parsed.imageUrl,
      imagePath: parsed.imagePath,
      requestOrigin
    });

    return Response.json({
      ok: true,
      postId: post.id
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Publish failed.");
  }
}
