import test from "node:test";
import assert from "node:assert/strict";
import { getOllamaTimeoutForInput } from "../lib/openai.ts";

test("getOllamaTimeoutForInput keeps base timeout for non-carousel posts", () => {
  process.env.OLLAMA_TIMEOUT_MS = "480000";

  const timeoutMs = getOllamaTimeoutForInput({
    topic: "Automacao",
    message: "Ganhe produtividade",
    tone: "professional",
    postType: "feed",
    carouselSlideCount: 3,
    carouselSlideContexts: [],
    brandColors: "#101828",
    outputLanguage: "pt-BR",
    customInstructions: "",
    keywords: "",
    userTopicHint: "",
    allowSimilarPost: false
  });

  assert.equal(timeoutMs, 480_000);
});

test("getOllamaTimeoutForInput adds four minutes per carousel slide", () => {
  process.env.OLLAMA_TIMEOUT_MS = "480000";

  const timeoutMs = getOllamaTimeoutForInput({
    topic: "Automacao",
    message: "Ganhe produtividade",
    tone: "professional",
    postType: "carousel",
    carouselSlideCount: 4,
    carouselSlideContexts: ["hook", "problema", "solucao", "cta"],
    brandColors: "#101828",
    outputLanguage: "pt-BR",
    customInstructions: "",
    keywords: "",
    userTopicHint: "",
    allowSimilarPost: false
  });

  assert.equal(timeoutMs, 1_440_000);
});
