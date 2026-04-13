import { requireEnv } from "@/lib/env";
import {
  buildPrompt,
  coerceGeneratedPost,
  extractJsonPayload,
  getFallbackModels,
  getOllamaTimeoutForInput,
  ollamaResponseSchema,
  type AutomationContext,
  type GeneratePostInput
} from "./openai.shared.ts";

export async function requestInstagramPostGeneration(
  input: GeneratePostInput,
  options?: {
    slideIndex?: number;
    slideCount?: number;
    slideContext?: string;
    styleGuide?: string;
    requireCaption?: boolean;
  },
  automationContext?: AutomationContext
) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const primaryModel = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const modelsToTry = [primaryModel, ...getFallbackModels(primaryModel)];
  const timeoutMs = getOllamaTimeoutForInput(input);
  const prompt = buildPrompt(input, options, automationContext);
  const attemptErrors: string[] = [];

  for (const [index, model] of modelsToTry.entries()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          stream: false,
          format: "json",
          options: {
            temperature: 0.4
          },
          messages: [
            {
              role: "system",
              content:
                "You generate structured Instagram content payloads for direct rendering and publishing."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });
      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${responseText}`.trim());
      }
      const parsedResponse = ollamaResponseSchema.parse(JSON.parse(responseText));
      return coerceGeneratedPost(JSON.parse(extractJsonPayload(parsedResponse.message.content)));
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? `Ollama request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
          : error instanceof Error
            ? error.message
            : String(error);
      attemptErrors.push(`${model}: ${message}`);
      if (index === modelsToTry.length - 1) {
        throw new Error(message);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(
    attemptErrors[attemptErrors.length - 1] ?? "Ollama generation failed unexpectedly."
  );
}
