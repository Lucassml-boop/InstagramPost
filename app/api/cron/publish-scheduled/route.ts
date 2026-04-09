import { NextResponse } from "next/server";
import { ensureCronAccess } from "@/lib/cron-auth";
import { processScheduledPosts } from "@/lib/posts";
import { getRequestOrigin } from "@/lib/server-utils";

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const count = await processScheduledPosts(getRequestOrigin(request));
  return NextResponse.json({ processed: count });
}
