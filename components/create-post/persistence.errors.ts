import type {
  GeneratorErrorState,
  SimilarPostErrorDetail
} from "./types";

function isSimilarPostErrorDetail(value: unknown): value is SimilarPostErrorDetail {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { field?: unknown }).field &&
      typeof (value as { field?: unknown }).field === "string" &&
      typeof (value as { label?: unknown }).label === "string" &&
      typeof (value as { matchType?: unknown }).matchType === "string" &&
      typeof (value as { candidateValue?: unknown }).candidateValue === "string" &&
      typeof (value as { existingValue?: unknown }).existingValue === "string"
  );
}

export function restorePersistedError(value: unknown): GeneratorErrorState | null {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if ((value as { type?: unknown }).type !== "similar-manual-post") {
    return null;
  }

  const candidate = value as {
    message?: unknown;
    similarPost?: {
      id?: unknown;
      href?: unknown;
      createdAt?: unknown;
      details?: unknown;
    };
  };

  if (
    typeof candidate.message !== "string" ||
    !candidate.similarPost ||
    typeof candidate.similarPost.id !== "string" ||
    typeof candidate.similarPost.href !== "string" ||
    typeof candidate.similarPost.createdAt !== "string" ||
    !Array.isArray(candidate.similarPost.details)
  ) {
    return null;
  }

  return {
    type: "similar-manual-post",
    message: candidate.message,
    similarPost: {
      id: candidate.similarPost.id,
      href: candidate.similarPost.href,
      createdAt: candidate.similarPost.createdAt,
      details: candidate.similarPost.details.filter(isSimilarPostErrorDetail)
    }
  };
}
