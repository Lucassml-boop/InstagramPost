import { NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/lib/auth";
import { jsonError } from "@/lib/server-utils";
import { forgotPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const parsed = forgotPasswordSchema.parse(await request.json());
    const result = await createPasswordResetRequest(parsed.email, new URL(request.url).origin);

    return NextResponse.json({
      ok: true,
      resetUrl: result.resetUrl
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Password reset request failed."
    );
  }
}
