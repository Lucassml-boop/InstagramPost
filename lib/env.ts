export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    const context = {
      env: process.env.NODE_ENV ?? "unknown",
      vercelEnv: process.env.VERCEL_ENV ?? "unknown",
      hasVercelUrl: Boolean(process.env.VERCEL_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
      hasAppBaseUrl: Boolean(process.env.APP_BASE_URL)
    };

    console.error(`[env] Missing environment variable: ${name}`, context);
    console.error(new Error(`[env] Stack for missing ${name}`).stack);
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getBaseUrl(fallbackOrigin?: string) {
  const explicit = process.env.APP_BASE_URL;

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  if (redirectUri) {
    return new URL(redirectUri).origin;
  }

  return "http://localhost:3020";
}
