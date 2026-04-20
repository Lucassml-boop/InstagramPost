BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'PublicationState'
  ) THEN
    CREATE TYPE "PublicationState" AS ENUM ('PUBLISHED', 'ARCHIVED', 'DELETED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'WeeklyAgendaResolution'
  ) THEN
    CREATE TYPE "WeeklyAgendaResolution" AS ENUM ('KEEP_UNUSED', 'REGENERATED');
  END IF;
END $$;

ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "publicationState" "PublicationState";

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WeeklyAgendaState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL,
  "weekStartDate" TIMESTAMP(3) NOT NULL,
  "weekEndDate" TIMESTAMP(3) NOT NULL,
  "weekKey" TEXT NOT NULL,
  "resolution" "WeeklyAgendaResolution",
  "resolutionUpdatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WeeklyAgendaState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyAgendaState_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key"
ON "PasswordResetToken"("tokenHash");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_expiresAt_idx"
ON "PasswordResetToken"("userId", "expiresAt");

CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyAgendaState_userId_key"
ON "WeeklyAgendaState"("userId");

CREATE INDEX IF NOT EXISTS "WeeklyAgendaState_weekStartDate_weekEndDate_idx"
ON "WeeklyAgendaState"("weekStartDate", "weekEndDate");

COMMIT;
