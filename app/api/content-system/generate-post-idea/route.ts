import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateAutomaticPostIdea } from "@/lib/content-system";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const idea = await generateAutomaticPostIdea(body);

    return NextResponse.json({
      ok: true,
      idea
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Automatic post idea generation failed.",
      500
    );
  }
}
