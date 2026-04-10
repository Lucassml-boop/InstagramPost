import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateAutomaticSettingsBundle } from "@/lib/content-system";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const result = await generateAutomaticSettingsBundle(body);

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Automatic settings bundle generation failed.",
      500
    );
  }
}
