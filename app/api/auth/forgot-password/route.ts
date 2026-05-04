import { NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/lib/auth";
import { getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { jsonError } from "@/lib/server-utils";
import { forgotPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const rateLimit = await rateLimitResponse({
      key: `auth:forgot-password:${getClientIp(request)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000
    });
    if (rateLimit) {
      return rateLimit;
    }

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
