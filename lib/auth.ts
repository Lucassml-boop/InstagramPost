import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { decryptValue, encryptValue, hashSensitiveValue, hashToken, randomToken } from "@/lib/crypto";

export const SESSION_COOKIE_NAME = "social_manager_session";
export const OAUTH_STATE_COOKIE_NAME = "instagram_oauth_state";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type AuthUser = {
  id: string;
  email: string;
};

function getStoredEmail(user: {
  email: string | null;
  emailEncrypted: string | null;
  emailIv: string | null;
  emailTag: string | null;
}) {
  if (user.emailEncrypted && user.emailIv && user.emailTag) {
    return decryptValue({
      encrypted: user.emailEncrypted,
      iv: user.emailIv,
      tag: user.emailTag
    });
  }

  return user.email ?? "";
}

export async function loginOrRegister(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { emailHash: hashSensitiveValue(normalizedEmail) },
        { email: normalizedEmail }
      ]
    }
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    const encryptedEmail = encryptValue(normalizedEmail);

    user = await prisma.user.create({
      data: {
        email: null,
        emailHash: hashSensitiveValue(normalizedEmail),
        emailEncrypted: encryptedEmail.encrypted,
        emailIv: encryptedEmail.iv,
        emailTag: encryptedEmail.tag,
        passwordHash
      }
    });
  } else {
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    if (!user.emailHash || !user.emailEncrypted || !user.emailIv || !user.emailTag || user.email) {
      const encryptedEmail = encryptValue(normalizedEmail);

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: null,
          emailHash: hashSensitiveValue(normalizedEmail),
          emailEncrypted: encryptedEmail.encrypted,
          emailIv: encryptedEmail.iv,
          emailTag: encryptedEmail.tag
        }
      });
    }
  }

  return {
    id: user.id,
    email: getStoredEmail(user)
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
    email: getStoredEmail(session.user)
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
