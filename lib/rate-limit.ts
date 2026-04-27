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

const buckets = new Map<string, RateLimitBucket>();

function now() {
  return Date.now();
}

function cleanupExpiredBuckets(referenceTime: number) {
  if (buckets.size < 5000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= referenceTime) {
      buckets.delete(key);
    }
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

export function checkRateLimit(options: RateLimitOptions) {
  const referenceTime = now();
  cleanupExpiredBuckets(referenceTime);

  const bucket = buckets.get(options.key);
  if (!bucket || bucket.resetAt <= referenceTime) {
    buckets.set(options.key, {
      count: 1,
      resetAt: referenceTime + options.windowMs
    });
    return {
      ok: true as const,
      remaining: options.limit - 1,
      retryAfterSeconds: 0
    };
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false as const,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - referenceTime) / 1000))
    };
  }

  bucket.count += 1;
  return {
    ok: true as const,
    remaining: options.limit - bucket.count,
    retryAfterSeconds: 0
  };
}

export function rateLimitResponse(options: RateLimitOptions) {
  const result = checkRateLimit(options);

  if (result.ok) {
    return null;
  }

  return jsonError(
    "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.",
    429,
    {
      retryAfterSeconds: result.retryAfterSeconds
    }
  );
}
