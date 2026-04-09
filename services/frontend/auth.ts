import { parseJsonOrThrow } from "@/lib/client/http";

export async function login(input: { email: string; password: string }) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; error?: string }>(
    response,
    "Unable to continue."
  );
}
