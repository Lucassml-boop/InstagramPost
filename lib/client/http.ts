export async function parseJsonResponse<T>(response: Response) {
  return (await response.json()) as T;
}

export async function parseJsonOrThrow<T extends { error?: string }>(
  response: Response,
  fallbackError: string
) {
  const json = await parseJsonResponse<T>(response);

  if (!response.ok) {
    throw new Error(json.error ?? fallbackError);
  }

  return json;
}

export function getClientRequestErrorMessage(
  error: unknown,
  fallback: string,
  serverConnectionError: string
) {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return serverConnectionError;
  }

  return error instanceof Error ? error.message : fallback;
}
