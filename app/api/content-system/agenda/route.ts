import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentWeeklyAgenda } from "@/lib/content-system";
import { jsonError } from "@/lib/server-utils";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const agenda = await getCurrentWeeklyAgenda();

  return NextResponse.json({
    ok: true,
    agenda
  });
}
