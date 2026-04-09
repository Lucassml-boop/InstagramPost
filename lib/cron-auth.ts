import { timingSafeEqual } from "node:crypto";
import { jsonError } from "./server-utils.ts";

type EnsureCronAccessDependencies = {
  getCurrentUser: () => Promise<{
    id: string;
    email: string;
    preferredOutputLanguage?: "en" | "pt-BR";
    preferredCustomInstructions?: string | null;
  } | null>;
};

function getBearerToken(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function secretsMatch(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function hasValidCronSecret(request: Request, configuredSecret: string) {
  const authorizationToken = getBearerToken(request.headers.get("authorization"));
  const headerSecret = request.headers.get("x-cron-secret")?.trim() ?? null;

  if (authorizationToken && secretsMatch(configuredSecret, authorizationToken)) {
    return true;
  }

  if (headerSecret && secretsMatch(configuredSecret, headerSecret)) {
    return true;
  }

  return false;
}

export async function ensureCronAccess(
  request: Request,
  dependencies?: EnsureCronAccessDependencies
) {
  const resolvedDependencies =
    dependencies ??
    ({
      getCurrentUser: async () => {
        const { getCurrentUser } = await import("./auth.ts");
        return getCurrentUser();
      }
    } satisfies EnsureCronAccessDependencies);

  const user = await resolvedDependencies.getCurrentUser();

  if (user) {
    return null;
  }

  const configuredSecret = process.env.CRON_SECRET?.trim();

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      return jsonError("CRON_SECRET is required in production for cron routes.", 500);
    }

    return null;
  }

  if (hasValidCronSecret(request, configuredSecret)) {
    return null;
  }

  return jsonError("Unauthorized", 401);
}
