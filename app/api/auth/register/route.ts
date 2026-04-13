import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, registerUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { jsonError } from "@/lib/server-utils";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.parse(await request.json());
    const user = await registerUser(parsed.email, parsed.password);
    const session = await createSession(user);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Registration failed.");
  }
}
