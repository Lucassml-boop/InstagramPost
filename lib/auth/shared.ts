import { decryptValue } from "@/lib/crypto";

export const SESSION_COOKIE_NAME = "social_manager_session";
export const OAUTH_STATE_COOKIE_NAME = "instagram_oauth_state";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
export const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30;

export type AuthUser = {
  id: string;
  email: string;
  preferredOutputLanguage?: "en" | "pt-BR";
  preferredCustomInstructions?: string | null;
};

export function getStoredEmail(user: {
  email: string | null;
  emailEncrypted: string | null;
  emailIv: string | null;
  emailTag: string | null;
}) {
  if (user.emailEncrypted && user.emailIv && user.emailTag) {
    return decryptValue({
      encrypted: user.emailEncrypted,
      iv: user.emailIv,
      tag: user.emailTag
    });
  }

  return user.email ?? "";
}

export function toAuthUser(user: {
  id: string;
  email: string | null;
  emailEncrypted: string | null;
  emailIv: string | null;
  emailTag: string | null;
  preferredOutputLanguage: string | null;
  preferredCustomInstructions: string | null;
}) {
  return {
    id: user.id,
    email: getStoredEmail(user),
    preferredOutputLanguage:
      user.preferredOutputLanguage === "pt-BR" ? "pt-BR" : "en",
    preferredCustomInstructions: user.preferredCustomInstructions
  } satisfies AuthUser;
}
