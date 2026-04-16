import { requireEnv } from "@/lib/env";
import {
  buildPrompt,
  coerceGeneratedPost,
  extractJsonPayload,
  fixMalformedJSON,
  getFallbackModels,
  getOllamaTimeoutForInput,
  ollamaResponseSchema,
  sanitizeGeneratedPost,
  type AutomationContext,
  type GeneratePostInput
} from "./openai.shared.ts";

const MAX_RETRIES_ON_503 = 3;
const INITIAL_RETRY_DELAY_MS = 2000;

function isTemporarilyUnavailable(statusCode: number): boolean {
  // 503 = Service Unavailable, 429 = Too Many Requests
  return statusCode === 503 || statusCode === 429;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tenta a requisição novamente com backoff exponencial em caso de erros temporários
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  maxRetries = MAX_RETRIES_ON_503
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal
        });
        
        // Se for erro 503/429 e não for a última tentativa, aguardar e tentar novamente
        if (isTemporarilyUnavailable(response.status) && attempt < maxRetries) {
          const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[openai] Service temporarily unavailable (${response.status}), retrying in ${delayMs}ms...`, {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1
          });
          await sleep(delayMs);
          continue;
        }
        
        return response;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Se for AbortError (timeout) e não for a última tentativa, tentar novamente
      if (lastError.name === "AbortError" && attempt < maxRetries) {
        const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[openai] Request timeout, retrying in ${delayMs}ms...`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        });
        await sleep(delayMs);
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError ?? new Error("Fetch with retry failed unexpectedly");
}

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
  const requestStartedAt = Date.now();

  for (const [index, model] of modelsToTry.entries()) {
    const attemptStartedAt = Date.now();

    console.info("[openai] Generation attempt started", {
      model,
      attempt: index + 1,
      totalAttempts: modelsToTry.length,
      postType: input.postType,
      topic: input.topic,
      slideIndex: options?.slideIndex ?? 1,
      slideCount: options?.slideCount ?? 1,
      timeoutMs
    });

    try {
      const response = await fetchWithRetry(
        "https://ollama.com/api/chat",
        {
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
          })
        },
        timeoutMs
      );

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${responseText}`.trim());
      }
      const parsedResponse = ollamaResponseSchema.parse(JSON.parse(responseText));
      console.info("[openai] Generation attempt finished", {
        model,
        attempt: index + 1,
        durationMs: Date.now() - attemptStartedAt,
        totalDurationMs: Date.now() - requestStartedAt,
        responseBytes: responseText.length
      });
      const extractedJson = extractJsonPayload(parsedResponse.message.content);
      const fixedJson = fixMalformedJSON(extractedJson);
      return sanitizeGeneratedPost(
        coerceGeneratedPost(JSON.parse(fixedJson)),
        input
      );
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? `Ollama request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
          : error instanceof Error
            ? error.message
            : String(error);
      console.warn("[openai] Generation attempt failed", {
        model,
        attempt: index + 1,
        durationMs: Date.now() - attemptStartedAt,
        totalDurationMs: Date.now() - requestStartedAt,
        error: message
      });
      attemptErrors.push(`${model}: ${message}`);
      if (index === modelsToTry.length - 1) {
        throw new Error(message);
      }
    }
  }

  throw new Error(
    attemptErrors[attemptErrors.length - 1] ?? "Ollama generation failed unexpectedly."
  );
}
