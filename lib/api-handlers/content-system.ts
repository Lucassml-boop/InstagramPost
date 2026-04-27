import { jsonError } from "../server-utils.ts";

type AuthUser = {
  id: string;
};

type BrandProfileDeps = {
  getContentBrandProfile: (userId?: string) => Promise<unknown>;
  updateContentBrandProfile: (input: unknown, userId?: string) => Promise<unknown>;
  getContentTopicsHistory: (userId?: string) => Promise<string[]>;
  clearTopicsHistory: (userId?: string) => Promise<unknown>;
};

async function getDefaultDeps(): Promise<BrandProfileDeps> {
  const contentSystem = await import("../content-system.ts");

  return {
    getContentBrandProfile: contentSystem.getContentBrandProfile,
    updateContentBrandProfile: contentSystem.updateContentBrandProfile,
    getContentTopicsHistory: contentSystem.getContentTopicsHistory,
    clearTopicsHistory: contentSystem.clearTopicsHistory
  };
}

export async function handleGetBrandProfile(
  user: AuthUser | null,
  deps?: BrandProfileDeps
) {
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const resolvedDeps = deps ?? (await getDefaultDeps());
  const profile = await resolvedDeps.getContentBrandProfile(user.id);

  return Response.json({
    ok: true,
    profile
  });
}

export async function handleUpdateBrandProfile(
  request: Request,
  user: AuthUser | null,
  deps?: BrandProfileDeps
) {
  try {
    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const resolvedDeps = deps ?? (await getDefaultDeps());
    const profile = await resolvedDeps.updateContentBrandProfile(await request.json(), user.id);

    return Response.json({
      ok: true,
      profile
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to save content automation settings."
    );
  }
}

export async function handleGetTopicsHistory(
  user: AuthUser | null,
  deps?: BrandProfileDeps
) {
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const resolvedDeps = deps ?? (await getDefaultDeps());
  const topicsHistory = await resolvedDeps.getContentTopicsHistory(user.id);

  return Response.json({
    ok: true,
    topicsHistory
  });
}

export async function handleClearTopicsHistory(
  user: AuthUser | null,
  deps?: BrandProfileDeps
) {
  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const resolvedDeps = deps ?? (await getDefaultDeps());
  await resolvedDeps.clearTopicsHistory(user.id);

  return Response.json({
    ok: true,
    topicsHistory: []
  });
}
