import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteQueuedPosts } from "@/lib/posts";
import { jsonError } from "@/lib/server-utils";
import { deletePostsSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = deletePostsSchema.parse(await request.json());
    const deletedCount = await deleteQueuedPosts({
      userId: user.id,
      postIds: parsed.postIds
    });

    return NextResponse.json({
      ok: true,
      deletedCount
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Delete failed.");
  }
}
