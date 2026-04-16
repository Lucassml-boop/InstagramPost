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
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const parsed = publishNowSchema.parse(await request.json());

    await publishPostNow({
      postId: parsed.postId,
      userId: user.id,
      requestOrigin: getRequestOrigin(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to publish now.");
  }
}
