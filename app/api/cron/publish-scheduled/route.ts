import { NextResponse } from "next/server";
import { processScheduledPosts } from "@/lib/posts";
import { getRequestOrigin } from "@/lib/server-utils";

export async function POST(request: Request) {
  const count = await processScheduledPosts(getRequestOrigin(request));
  return NextResponse.json({ processed: count });
}
