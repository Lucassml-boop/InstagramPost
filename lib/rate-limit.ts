import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/server-utils";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const memoryBuckets = new Map<string, RateLimitBucket>();

function getNow() {
  return Date.now();
}

function checkMemoryRateLimit(options: RateLimitOptions) {
  const referenceTime = getNow();
  const bucket = memoryBuckets.get(options.key);

  if (!bucket || bucket.resetAt <= referenceTime) {
    memoryBuckets.set(options.key, {
      count: 1,
      resetAt: referenceTime + options.windowMs
    });
    return { ok: true as const, retryAfterSeconds: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - referenceTime) / 1000))
    };
  }

  bucket.count += 1;
  return { ok: true as const, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

export async function checkRateLimit(options: RateLimitOptions) {
  if (!process.env.DATABASE_URL) {
    return checkMemoryRateLimit(options);
  }

  try {
    const referenceDate = new Date();
    await prisma.rateLimitBucket.deleteMany({
      where: { resetAt: { lte: referenceDate } }
    });

    const existing = await prisma.rateLimitBucket.findUnique({
      where: { key: options.key }
    });

    if (!existing || existing.resetAt <= referenceDate) {
      await prisma.rateLimitBucket.upsert({
        where: { key: options.key },
        create: {
          key: options.key,
          count: 1,
          resetAt: new Date(referenceDate.getTime() + options.windowMs)
        },
        update: {
          count: 1,
          resetAt: new Date(referenceDate.getTime() + options.windowMs)
        }
      });
      return { ok: true as const, retryAfterSeconds: 0 };
    }

    if (existing.count >= options.limit) {
      return {
        ok: false as const,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt.getTime() - referenceDate.getTime()) / 1000)
        )
      };
    }

    await prisma.rateLimitBucket.update({
      where: { key: options.key },
      data: { count: { increment: 1 } }
    });
    return { ok: true as const, retryAfterSeconds: 0 };
  } catch (error) {
    console.warn("[rate-limit] Falling back to in-memory bucket", {
      key: options.key,
      message: error instanceof Error ? error.message : "unknown"
    });
    return checkMemoryRateLimit(options);
  }
}

export async function rateLimitResponse(options: RateLimitOptions) {
  const result = await checkRateLimit(options);

  if (result.ok) {
    return null;
  }

  return jsonError(
    "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.",
    429,
    { retryAfterSeconds: result.retryAfterSeconds }
  );
}
