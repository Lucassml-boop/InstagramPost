export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  return url.origin;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
