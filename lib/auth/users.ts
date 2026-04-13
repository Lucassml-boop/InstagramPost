import bcrypt from "bcryptjs";
import { encryptValue, hashSensitiveValue } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { toAuthUser } from "./shared";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function assertPasswordStrength(password: string) {
  if (!password || password.length < 8) {
    throw new Error("Password must have at least 8 characters.");
  }
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  return prisma.user.findFirst({
    where: {
      OR: [
        { emailHash: hashSensitiveValue(normalizedEmail) },
        { email: normalizedEmail }
      ]
    }
  });
}

type StoredAuthUserRecord = NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>;

export async function syncStoredEmail(user: StoredAuthUserRecord, normalizedEmail: string) {
  if (user.emailHash && user.emailEncrypted && user.emailIv && user.emailTag && !user.email) {
    return user;
  }

  const encryptedEmail = encryptValue(normalizedEmail);

  return prisma.user.update({
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

export async function registerUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  assertPasswordStrength(password);

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const encryptedEmail = encryptValue(normalizedEmail);

  const user = await prisma.user.create({
    data: {
      email: null,
      emailHash: hashSensitiveValue(normalizedEmail),
      emailEncrypted: encryptedEmail.encrypted,
      emailIv: encryptedEmail.iv,
      emailTag: encryptedEmail.tag,
      passwordHash
    }
  });

  return toAuthUser(user);
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  let user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password.");
  }

  user = await syncStoredEmail(user, normalizedEmail);
  return toAuthUser(user);
}
