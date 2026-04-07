import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publishPostNow } from "@/lib/posts";
import { getRequestOrigin, jsonError } from "@/lib/server-utils";
import { publishPostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = publishPostSchema.parse(await request.json());
    const post = await publishPostNow({
      postId: parsed.postId,
      userId: user.id,
      caption: parsed.caption,
      imageUrl: parsed.imageUrl,
      imagePath: parsed.imagePath,
      requestOrigin: getRequestOrigin(request)
    });

    return NextResponse.json({
      ok: true,
      postId: post.id
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Publish failed.");
  }
}
