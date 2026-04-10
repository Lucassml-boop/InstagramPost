import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateAutomaticSetting } from "@/lib/content-system";
import { jsonError } from "@/lib/server-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const result = await generateAutomaticSetting(body);

    return NextResponse.json({
      ok: true,
      value: result.value
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Automatic setting generation failed.",
      500
    );
  }
}
