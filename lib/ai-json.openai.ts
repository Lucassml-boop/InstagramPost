import { requireEnv } from "@/lib/env";
import { extractJsonPayload } from "./openai.shared.ts";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MAX_RATE_LIMIT_RETRIES = 4;

type JsonGenerationInput = {
  prompt: string;
  system: string;
  timeoutMs?: number;
  temperature?: number;
  model?: string;
};

type OpenAIResponseContent = {
  type?: string;
  text?: string;
};

type OpenAIResponseOutput = {
  content?: OpenAIResponseContent[];
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: OpenAIResponseOutput[];
};

function parseJsonPayload(raw: string) {
  return JSON.parse(extractJsonPayload(raw));
}

function extractOpenAIText(body: OpenAIResponseBody) {
  if (body.output_text?.trim()) {
    return body.output_text.trim();
  }

  const text = body.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("OpenAI did not return text content.");
  }

  return text;
}

function getRetryDelayMs(response: Response, responseText: string, attempt: number) {
  const retryAfterSeconds = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  const messageDelay = responseText.match(/try again in\s+(\d+)s/i);
  if (messageDelay) {
    return Number(messageDelay[1]) * 1000;
  }

  return Math.min(60_000, 10_000 * Math.pow(2, attempt));
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestOpenAIJson(input: JsonGenerationInput, model: string, timeoutMs: number) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  console.info("[ai-json] OpenAI JSON request started", { model });

  for (let attempt = 0; attempt <= OPENAI_MAX_RATE_LIMIT_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "json_response",
            schema: {
              type: "object",
              properties: {},
              required: [],
              additionalProperties: true
            },
            strict: false
          }
        }
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    const text = await response.text();
    if (response.status === 429 && attempt < OPENAI_MAX_RATE_LIMIT_RETRIES) {
      const delayMs = getRetryDelayMs(response, text, attempt);
      console.warn("[ai-json] OpenAI rate limit reached, retrying", {
        model,
        attempt: attempt + 1,
        maxAttempts: OPENAI_MAX_RATE_LIMIT_RETRIES + 1,
        delayMs
      });
      await sleep(delayMs);
      continue;
    }

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status} ${text}`.trim());
    }

    const outputText = extractOpenAIText(JSON.parse(text) as OpenAIResponseBody);
    console.info("[ai-json] OpenAI JSON request finished", {
      model,
      responseBytes: text.length,
      outputBytes: outputText.length
    });
    return parseJsonPayload(outputText);
  }

  throw new Error("OpenAI request failed after rate limit retries.");
}
