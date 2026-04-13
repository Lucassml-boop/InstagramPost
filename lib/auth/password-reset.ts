import bcrypt from "bcryptjs";
import { getBaseUrl } from "@/lib/env";
import { hashToken, randomToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { PASSWORD_RESET_TTL_MS, toAuthUser } from "./shared";
import { assertPasswordStrength, findUserByEmail, normalizeEmail } from "./users";

export async function createPasswordResetRequest(email: string, requestOrigin?: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return { ok: true, resetUrl: null as string | null };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id }
  });

  const rawToken = randomToken(32);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt
    }
  });

  const baseUrl = getBaseUrl(requestOrigin);
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  console.log("[auth] Password reset requested", {
    userId: user.id,
    emailHash: user.emailHash,
    expiresAt: expiresAt.toISOString(),
    hasResetUrlPreview: process.env.NODE_ENV !== "production"
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[auth] Development password reset URL", { resetUrl });
  }

  return {
    ok: true,
    resetUrl: process.env.NODE_ENV === "production" ? null : resetUrl
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  if (!token) {
    throw new Error("Reset token is required.");
  }

  assertPasswordStrength(password);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("This password reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: record.userId,
        id: { not: record.id }
      }
    }),
    prisma.session.deleteMany({
      where: { userId: record.userId }
    })
  ]);

  return toAuthUser(record.user);
}
