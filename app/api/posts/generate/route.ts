import { NextResponse } from "next/server";
import { createDraftPost } from "@/lib/posts";
import { generateInstagramPost } from "@/lib/openai";
import { renderPostImage } from "@/lib/renderer";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/server-utils";
import { slugify } from "@/lib/storage";
import { generatePostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const phaseStartedAt = {
    auth: Date.now(),
    ai: 0,
    render: 0,
    draft: 0
  };

  try {
    console.info("[api/posts/generate] Request started");
    const user = await getCurrentUser();
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

    const parsed = generatePostSchema.parse(await request.json());
    console.info("[api/posts/generate] Payload parsed", {
      userId: user.id,
      topic: parsed.topic,
      tone: parsed.tone,
      outputLanguage: parsed.outputLanguage,
      hasCustomInstructions: Boolean(parsed.customInstructions?.trim()),
      hasMessage: Boolean(parsed.message.trim()),
      hasKeywords: Boolean(parsed.keywords?.trim()),
      brandColors: parsed.brandColors
    });

    phaseStartedAt.ai = Date.now();
    const generated = await generateInstagramPost(parsed);
    console.info("[api/posts/generate] Text and layout generated", {
      userId: user.id,
      aiDurationMs: Date.now() - phaseStartedAt.ai,
      totalDurationMs: Date.now() - startedAt,
      hashtagsCount: generated.hashtags.length
    });

    if (!generated) {
      throw new Error("The AI provider did not return a structured post payload.");
    }

    phaseStartedAt.render = Date.now();
    const image = await renderPostImage({
      slug: slugify(parsed.topic),
      html: generated.html,
      css: generated.css
    });
    console.info("[api/posts/generate] Image rendered", {
      userId: user.id,
      renderDurationMs: Date.now() - phaseStartedAt.render,
      totalDurationMs: Date.now() - startedAt,
      imagePath: image.absolutePath
    });

    phaseStartedAt.draft = Date.now();
    const draft = await createDraftPost({
      userId: user.id,
      topic: parsed.topic,
      message: parsed.message,
      tone: parsed.tone,
      brandColors: parsed.brandColors,
      keywords: parsed.keywords,
      caption: generated.caption,
      hashtags: generated.hashtags,
      htmlLayout: JSON.stringify({
        html: generated.html,
        css: generated.css
      }),
      imageUrl: image.publicPath,
      imagePath: image.absolutePath
    });

    console.info("[api/posts/generate] Draft created", {
      userId: user.id,
      postId: draft.id,
      draftDurationMs: Date.now() - phaseStartedAt.draft,
      totalDurationMs: Date.now() - startedAt
    });

    return NextResponse.json({
      postId: draft.id,
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
