import test from "node:test";
import assert from "node:assert/strict";
import { ensureCronAccess } from "../lib/cron-auth.ts";

function setEnv(name: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;

  if (value === undefined) {
    delete env[name];
    return;
  }

  env[name] = value;
}

test("ensureCronAccess allows authenticated users without cron secret", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCronSecret = process.env.CRON_SECRET;

  setEnv("NODE_ENV", "production");
  setEnv("CRON_SECRET", undefined);

  const response = await ensureCronAccess(new Request("https://example.com/api/cron/test"), {
    getCurrentUser: async () => ({
      id: "user_123",
      email: "test@example.com",
      preferredOutputLanguage: "en",
      preferredCustomInstructions: null
    })
  });

  assert.equal(response, null);

  setEnv("NODE_ENV", originalNodeEnv);
  setEnv("CRON_SECRET", originalCronSecret);
});

test("ensureCronAccess allows valid bearer secret", async () => {
  const originalCronSecret = process.env.CRON_SECRET;
  setEnv("CRON_SECRET", "super-secret");

  const response = await ensureCronAccess(
    new Request("https://example.com/api/cron/test", {
      headers: {
        Authorization: "Bearer super-secret"
      }
    }),
    {
      getCurrentUser: async () => null
    }
  );

  assert.equal(response, null);

  setEnv("CRON_SECRET", originalCronSecret);
});

test("ensureCronAccess blocks invalid secrets", async () => {
  const originalCronSecret = process.env.CRON_SECRET;
  setEnv("CRON_SECRET", "super-secret");

  const response = await ensureCronAccess(
    new Request("https://example.com/api/cron/test", {
      headers: {
        "x-cron-secret": "wrong-secret"
      }
    }),
    {
      getCurrentUser: async () => null
    }
  );

  const json = await response?.json();

  assert.equal(response?.status, 401);
  assert.deepEqual(json, { error: "Unauthorized" });

  setEnv("CRON_SECRET", originalCronSecret);
});

test("ensureCronAccess fails loudly in production when CRON_SECRET is missing", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCronSecret = process.env.CRON_SECRET;

  setEnv("NODE_ENV", "production");
  setEnv("CRON_SECRET", undefined);

  const response = await ensureCronAccess(new Request("https://example.com/api/cron/test"), {
    getCurrentUser: async () => null
  });
  const json = await response?.json();

  assert.equal(response?.status, 500);
  assert.deepEqual(json, {
    error: "CRON_SECRET is required in production for cron routes."
  });

  setEnv("NODE_ENV", originalNodeEnv);
  setEnv("CRON_SECRET", originalCronSecret);
});
