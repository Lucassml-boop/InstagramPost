import { requireEnv } from "@/lib/env";
import { DEFAULT_OLLAMA_TIMEOUT_MS } from "./content-system.constants.ts";
import { extractJsonPayload, ollamaResponseSchema } from "./openai.shared.ts";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OLLAMA_CHAT_URL = "https://ollama.com/api/chat";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
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

function getTimeoutMs(timeoutMs?: number) {
  return timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_OLLAMA_TIMEOUT_MS);
}

function shouldUseOpenAI() {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "openai";
}

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

async function requestOpenAIJson(input: JsonGenerationInput) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = input.model?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const timeoutMs = getTimeoutMs(input.timeoutMs);

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
          {
            role: "system",
            content: input.system
          },
          {
            role: "user",
            content: input.prompt
          }
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
    }).finally(() => {
      clearTimeout(timeout);
    });

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

async function requestOllamaJson(input: JsonGenerationInput) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = input.model?.trim() || process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs(input.timeoutMs));

  try {
    const response = await fetch(OLLAMA_CHAT_URL, {
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
          temperature: input.temperature ?? 0.7
        },
        messages: [
          {
            role: "system",
            content: input.system
          },
          {
            role: "user",
            content: input.prompt
          }
        ]
      }),
      signal: controller.signal
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${text}`.trim());
    }

    const parsed = ollamaResponseSchema.parse(JSON.parse(text));
    return parseJsonPayload(parsed.message.content);
  } finally {
    clearTimeout(timeout);
  }
}

export function getJsonGenerationProvider() {
  return shouldUseOpenAI() ? "openai" : "ollama";
}

export function getJsonGenerationModel(model?: string) {
  if (shouldUseOpenAI()) {
    return model?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  }

  return model?.trim() || process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
}

export async function requestJsonGeneration(input: JsonGenerationInput) {
  return shouldUseOpenAI() ? requestOpenAIJson(input) : requestOllamaJson(input);
}
