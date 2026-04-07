import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { requireEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function getRuntimeDatabaseUrl() {
  const databaseUrl = requireEnv("DATABASE_URL");

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
  const adapter = new PrismaPg({
    connectionString: getRuntimeDatabaseUrl(),
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
