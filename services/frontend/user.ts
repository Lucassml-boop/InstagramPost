import { parseJsonOrThrow } from "@/lib/client/http";
import type { OutputLanguage } from "@/components/create-post/types";

export async function saveGenerationSettings(input: {
  outputLanguage: OutputLanguage;
  customInstructions: string;
}) {
  const response = await fetch("/api/user/generation-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  return parseJsonOrThrow<
    {
      outputLanguage?: OutputLanguage;
      customInstructions?: string;
      error?: string;
    }
  >(response, "Unable to save settings.");
}
