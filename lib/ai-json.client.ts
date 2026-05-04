import { requireEnv } from "@/lib/env";
import { DEFAULT_OLLAMA_TIMEOUT_MS } from "./content-system.constants.ts";
import { extractJsonPayload, ollamaResponseSchema } from "./openai.shared.ts";
import { requestOpenAIJson } from "./ai-json.openai.ts";

const OLLAMA_CHAT_URL = "https://ollama.com/api/chat";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

type JsonGenerationInput = {
  prompt: string;
  system: string;
  timeoutMs?: number;
  temperature?: number;
  model?: string;
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
  if (shouldUseOpenAI()) {
    return requestOpenAIJson(input, getJsonGenerationModel(input.model), getTimeoutMs(input.timeoutMs));
  }

  return requestOllamaJson(input);
}
