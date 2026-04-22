import {
  getJsonGenerationModel,
  getJsonGenerationProvider,
  requestJsonGeneration
} from "@/lib/ai-json.client";
import {
  buildPrompt,
  coerceGeneratedPost,
  getFallbackModels,
  getOllamaTimeoutForInput,
  sanitizeGeneratedPost,
  type AutomationContext,
  type GeneratePostInput
} from "./openai.shared.ts";

const GENERATION_HEARTBEAT_MS = 15_000;

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
  const provider = getJsonGenerationProvider();
  const primaryModel = getJsonGenerationModel();
  const modelsToTry =
    provider === "openai" ? [primaryModel] : [primaryModel, ...getFallbackModels(primaryModel)];
  const timeoutMs = getOllamaTimeoutForInput(input);
  const prompt = buildPrompt(input, options, automationContext);
  const attemptErrors: string[] = [];
  const requestStartedAt = Date.now();

  for (const [index, model] of modelsToTry.entries()) {
    const attemptStartedAt = Date.now();

    console.info("[openai] Generation attempt started", {
      provider,
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
      const heartbeat = setInterval(() => {
        const elapsedMs = Date.now() - attemptStartedAt;
        console.info("[openai] Generation attempt still running", {
          provider,
          model,
          attempt: index + 1,
          totalAttempts: modelsToTry.length,
          postType: input.postType,
          topic: input.topic,
          slideIndex: options?.slideIndex ?? 1,
          slideCount: options?.slideCount ?? 1,
          elapsedMs,
          remainingTimeoutMs: Math.max(timeoutMs - elapsedMs, 0)
        });
      }, GENERATION_HEARTBEAT_MS);

      const rawGenerated = await requestJsonGeneration({
        model,
        prompt,
        system: "You generate structured Instagram content payloads for direct rendering and publishing.",
        temperature: 0.4,
        timeoutMs
      }).finally(() => {
        clearInterval(heartbeat);
      });

      console.info("[openai] Generation attempt finished", {
        provider,
        model,
        attempt: index + 1,
        durationMs: Date.now() - attemptStartedAt,
        totalDurationMs: Date.now() - requestStartedAt
      });

      const generated = sanitizeGeneratedPost(coerceGeneratedPost(rawGenerated), input);
      console.info("[openai] Generated JSON parsed", {
        provider,
        model,
        attempt: index + 1,
        captionBytes: generated.caption.length,
        hashtagsCount: generated.hashtags.length,
        htmlBytes: generated.html.length,
        cssBytes: generated.css.length,
        hasStyleGuide: Boolean(generated.styleGuide?.trim()),
        totalDurationMs: Date.now() - requestStartedAt
      });
      return generated;
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? `${provider} request timed out after ${Math.round(timeoutMs / 1000)} seconds.`
          : error instanceof Error
            ? error.message
            : String(error);
      console.warn("[openai] Generation attempt failed", {
        provider,
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
    attemptErrors[attemptErrors.length - 1] ?? `${provider} generation failed unexpectedly.`
  );
}
