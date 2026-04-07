import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, randomToken } from "@/lib/crypto";

export const SESSION_COOKIE_NAME = "social_manager_session";
export const OAUTH_STATE_COOKIE_NAME = "instagram_oauth_state";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  email: string;
};

export async function loginOrRegister(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash
      }
    });
  } else {
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error("Invalid email or password.");
    }
  }

  return {
    id: user.id,
    email: user.email
  } satisfies AuthUser;
}

export async function createSession(user: AuthUser) {
  const token = randomToken();
  const sessionHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionHash,
      expiresAt
    }
  });

  return {
    token,
    expiresAt
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionHash: hashToken(sessionToken) },
    include: { user: true }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email
  } satisfies AuthUser;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionHash: hashToken(sessionToken) }
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
