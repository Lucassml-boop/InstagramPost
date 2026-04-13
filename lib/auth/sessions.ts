import { cache } from "react";
import { cookies } from "next/headers";
import { hashToken, randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS, toAuthUser } from "./shared";

export async function createSession(user: { id: string }) {
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

export const getCurrentUser = cache(async () => {
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

  return toAuthUser(session.user);
});

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
