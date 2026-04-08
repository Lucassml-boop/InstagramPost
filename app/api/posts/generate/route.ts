import { NextResponse } from "next/server";
import { createDraftPost } from "@/lib/posts";
import { generateInstagramPost } from "@/lib/openai";
import { renderPostImage } from "@/lib/renderer";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/server-utils";
import { slugify } from "@/lib/storage";
import { generatePostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = generatePostSchema.parse(await request.json());
    const generated = await generateInstagramPost(parsed);

    if (!generated) {
      throw new Error("The AI provider did not return a structured post payload.");
    }

    const image = await renderPostImage({
      slug: slugify(parsed.topic),
      html: generated.html,
      css: generated.css
    });

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

    return NextResponse.json({
      postId: draft.id,
      imageUrl: draft.imageUrl,
      imagePath: draft.imagePath,
      caption: generated.caption,
      hashtags: generated.hashtags,
      htmlLayout: draft.htmlLayout
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to generate post.");
  }
}
