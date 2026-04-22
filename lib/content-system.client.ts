import { requestJsonGeneration } from "./ai-json.client.ts";

export async function requestOllamaJson(input: {
  prompt: string;
  system: string;
  timeoutMs?: number;
  temperature?: number;
}) {
  return requestJsonGeneration(input);
}
