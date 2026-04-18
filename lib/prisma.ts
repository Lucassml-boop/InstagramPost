import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function getConfiguredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

  if (!databaseUrl) {
    throw new Error("Missing environment variable: DATABASE_URL or DIRECT_URL");
  }

  return databaseUrl;
}

function getRuntimeDatabaseUrl() {
  const databaseUrl = getConfiguredDatabaseUrl();

  // pg-connection-string can let `sslmode=require` override the explicit `ssl`
  // config when using the Prisma pg adapter. For Supabase poolers, `no-verify`
  // avoids the self-signed certificate chain failure in serverless runtimes.
  if (databaseUrl.includes("sslmode=require")) {
    return databaseUrl.replace("sslmode=require", "sslmode=no-verify");
  }

  if (databaseUrl.includes("?")) {
    return `${databaseUrl}&sslmode=no-verify`;
  }

  return `${databaseUrl}?sslmode=no-verify`;
}

function createPrismaClient() {
  const runtimeDatabaseUrl = getRuntimeDatabaseUrl();
  const databaseHost = new URL(runtimeDatabaseUrl).host;

  console.log("[prisma] Initializing Prisma client", {
    env: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? "unknown",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasDirectUrl: Boolean(process.env.DIRECT_URL),
    databaseHost
  });

  const adapter = new PrismaPg({
    connectionString: runtimeDatabaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

function getPrismaClient() {
  if (!global.__prisma__) {
    global.__prisma__ = createPrismaClient();
  }

  return global.__prisma__;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getPrismaClient(), property, receiver);
  }
});

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = getPrismaClient();
}
