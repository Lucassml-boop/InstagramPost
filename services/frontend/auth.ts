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

export async function register(input: { email: string; password: string }) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; error?: string }>(
    response,
    "Unable to create your account."
  );
}

export async function requestPasswordReset(input: { email: string }) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; resetUrl?: string | null; error?: string }>(
    response,
    "Unable to request password reset."
  );
}

export async function resetPassword(input: { token: string; password: string }) {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<{ ok: true; error?: string }>(
    response,
    "Unable to reset password."
  );
}
