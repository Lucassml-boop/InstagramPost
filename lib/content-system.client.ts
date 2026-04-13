import { requireEnv } from "@/lib/env";
import { DEFAULT_OLLAMA_TIMEOUT_MS } from "./content-system.constants.ts";

type JsonContentResponse = {
  message?: {
    content?: string;
  };
};

function parseJsonContent(raw: string) {
  const parsed = JSON.parse(raw) as JsonContentResponse;
  const content = parsed.message?.content?.trim();
  if (!content) {
    throw new Error("Ollama did not return JSON content.");
  }
  return JSON.parse(
    content.startsWith("```")
      ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
      : content
  ) as unknown;
}

export async function requestOllamaJson(input: {
  prompt: string;
  system: string;
  timeoutMs?: number;
  temperature?: number;
}) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_OLLAMA_TIMEOUT_MS)
  );

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
    return parseJsonContent(text);
  } finally {
    clearTimeout(timeout);
  }
}
