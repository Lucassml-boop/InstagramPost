import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { schedulePost } from "@/lib/posts";
import { jsonError } from "@/lib/server-utils";
import { schedulePostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = schedulePostSchema.parse(await request.json());

    await schedulePost({
      postId: parsed.postId,
      userId: user.id,
      caption: parsed.caption,
      scheduledTime: new Date(parsed.scheduledTime),
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
