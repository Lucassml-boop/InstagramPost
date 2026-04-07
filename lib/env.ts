export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
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

  return "http://localhost:3000";
}
