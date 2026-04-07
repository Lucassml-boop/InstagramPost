import { NextResponse } from "next/server";

export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  return url.origin;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
