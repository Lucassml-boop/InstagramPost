import type { InstagramPostType } from "./instagram.types.ts";

export function buildGraphFetchError(action: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(
    `Nao foi possivel ${action} no Instagram porque a conexao com a Graph API falhou. Verifique sua internet, o tunel publico e tente novamente. Detalhe tecnico: ${detail}`
  );
}

export async function fetchInstagramGraph(
  action: string,
  input: RequestInfo | URL,
  init?: RequestInit
) {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw buildGraphFetchError(action, error);
  }
}

function getInstagramErrorSummary(json: unknown) {
  if (!json || typeof json !== "object") {
    return null;
  }

  const error = (json as { error?: unknown }).error;
  if (!error || typeof error !== "object") {
    return null;
  }

  const details = error as Record<string, unknown>;
  return {
    message: typeof details.message === "string" ? details.message : null,
    type: typeof details.type === "string" ? details.type : null,
    code: typeof details.code === "number" || typeof details.code === "string" ? details.code : null,
    errorSubcode:
      typeof details.error_subcode === "number" || typeof details.error_subcode === "string"
        ? details.error_subcode
        : null,
    fbtraceId: typeof details.fbtrace_id === "string" ? details.fbtrace_id : null
  };
}

export function logInstagramGraphFailure(input: {
  action: string;
  status: number;
  postType: InstagramPostType;
  mediaUrl?: string;
  mediaItemsCount: number;
  responseJson: unknown;
}) {
  console.error("[instagram-publish] Graph API request failed", {
    action: input.action,
    status: input.status,
    postType: input.postType,
    mediaUrl: input.mediaUrl,
    mediaItemsCount: input.mediaItemsCount,
    instagramError: getInstagramErrorSummary(input.responseJson)
  });
}
