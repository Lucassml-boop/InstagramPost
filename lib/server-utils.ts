export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  return url.origin;
}

export function jsonError(
  message: string,
  status = 400,
  payload?: Record<string, unknown>
) {
  return Response.json({ error: message, ...(payload ?? {}) }, { status });
}
