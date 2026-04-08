import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRequestOrigin, jsonError } from "@/lib/server-utils";
import { publishWeeklyAgendaPreview } from "@/lib/weekly-agenda-preview";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      selectedDate?: string;
    };

    const result = await publishWeeklyAgendaPreview({
      user,
      requestOrigin: getRequestOrigin(request),
      selectedDate: body.selectedDate?.trim() || undefined
    });

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to publish weekly agenda preview."
    );
  }
}
