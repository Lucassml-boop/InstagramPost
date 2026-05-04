type ContentStorageDelegateName =
  | "contentBrandProfile"
  | "contentWeeklyAgenda"
  | "contentTopicsHistory"
  | "contentHistory";

type ContentStorageFieldName = "data" | "agenda" | "records" | "items";

type JsonRecordDelegate = {
  findUnique: (input: { where: { userId: string } }) => Promise<Record<string, unknown> | null>;
  upsert: (input: {
    where: { userId: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }) => Promise<unknown>;
};

function isMissingContentStorageTableError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("ContentBrandProfile") ||
      error.message.includes("ContentWeeklyAgenda") ||
      error.message.includes("ContentTopicsHistory") ||
      error.message.includes("ContentHistory")) &&
    error.message.includes("does not exist")
  );
}

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

async function getDelegate(delegateName: ContentStorageDelegateName) {
  const prisma = await getPrisma();
  return (prisma as unknown as Record<string, JsonRecordDelegate>)[delegateName];
}

export async function readUserJsonRecord<T>(
  userId: string | undefined,
  delegateName: ContentStorageDelegateName,
  fieldName: ContentStorageFieldName,
  fallback: T
) {
  if (!userId) {
    return fallback;
  }

  try {
    const delegate = await getDelegate(delegateName);
    const record = await delegate.findUnique({ where: { userId } });
    return (record?.[fieldName] ?? fallback) as T;
  } catch (error) {
    if (isMissingContentStorageTableError(error)) {
      return fallback;
    }

    throw error;
  }
}

export async function upsertUserJsonRecord(
  userId: string | undefined,
  delegateName: ContentStorageDelegateName,
  fieldName: ContentStorageFieldName,
  value: unknown,
  extraFields?: Record<string, unknown>
) {
  if (!userId) {
    return false;
  }

  try {
    const delegate = await getDelegate(delegateName);
    await delegate.upsert({
      where: { userId },
      create: {
        userId,
        [fieldName]: value,
        ...(extraFields ?? {})
      },
      update: {
        [fieldName]: value,
        ...(extraFields ?? {})
      }
    });
    return true;
  } catch (error) {
    if (isMissingContentStorageTableError(error)) {
      return false;
    }

    throw error;
  }
}
