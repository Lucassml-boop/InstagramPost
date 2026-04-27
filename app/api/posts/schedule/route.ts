import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { schedulePost } from "@/lib/posts";
import { rateLimitResponse } from "@/lib/rate-limit";
import { jsonError } from "@/lib/server-utils";
import { schedulePostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const rateLimit = rateLimitResponse({
      key: `posts:schedule:${user.id}`,
      limit: 60,
      windowMs: 60 * 60 * 1000
    });
    if (rateLimit) {
      return rateLimit;
    }

    const parsed = schedulePostSchema.parse(await request.json());
    const scheduledTime = new Date(parsed.scheduledTime);

    if (Number.isNaN(scheduledTime.getTime())) {
      return jsonError("Invalid schedule time.", 400);
    }

    if (scheduledTime.getTime() <= Date.now()) {
      return jsonError(
        "Escolha um horario futuro para agendar este post. O horario informado ja passou.",
        400
      );
    }

    await schedulePost({
      postId: parsed.postId,
      userId: user.id,
      caption: parsed.caption,
      scheduledTime,
      postType: parsed.postType,
      mediaItems: parsed.mediaItems,
      imageUrl: parsed.imageUrl,
      imagePath: parsed.imagePath
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Schedule failed.");
  }
}
