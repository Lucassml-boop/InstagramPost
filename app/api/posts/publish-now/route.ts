import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publishPostNow } from "@/lib/posts";
import { jsonError } from "@/lib/server-utils";
import { getRequestOrigin } from "@/lib/server-utils";
import { z } from "zod";

const publishNowSchema = z.object({
  postId: z.string().min(1)
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  let parsedPostId: string | null = null;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = publishNowSchema.parse(await request.json());
    parsedPostId = parsed.postId;

    console.info("[api/posts/publish-now] Request started", {
      userId: user.id,
      postId: parsed.postId
    });

    await publishPostNow({
      postId: parsed.postId,
      userId: user.id,
      requestOrigin: getRequestOrigin(request)
    });

    console.info("[api/posts/publish-now] Request completed", {
      userId: user.id,
      postId: parsed.postId,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish now.";

    console.error("[api/posts/publish-now] Request failed", {
      postId: parsedPostId,
      durationMs: Date.now() - startedAt,
      error: message
    });

    return jsonError(message);
  }
}
