import crypto from "node:crypto";

function getEncryptionKey() {
  const secret =
    process.env.APP_ENCRYPTION_KEY ||
    process.env.INSTAGRAM_APP_SECRET ||
    process.env.OPENAI_API_KEY ||
    "development-secret";

  return crypto.createHash("sha256").update(secret).digest();
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function hashSensitiveValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export function encryptValue(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64")
  };
}

export function decryptValue(payload: {
  encrypted: string;
  iv: string;
  tag: string;
}) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
}
