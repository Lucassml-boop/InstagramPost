import { jsonError } from "../server-utils.ts";

type AuthUser = {
  id: string;
};

type BrandProfileDeps = {
  getContentBrandProfile: () => Promise<unknown>;
  updateContentBrandProfile: (input: unknown) => Promise<unknown>;
  getContentTopicsHistory: () => Promise<string[]>;
  clearTopicsHistory: () => Promise<void>;
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
  const profile = await resolvedDeps.getContentBrandProfile();

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
    const profile = await resolvedDeps.updateContentBrandProfile(await request.json());

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
  const topicsHistory = await resolvedDeps.getContentTopicsHistory();

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
  await resolvedDeps.clearTopicsHistory();

  return Response.json({
    ok: true,
    topicsHistory: []
  });
}
