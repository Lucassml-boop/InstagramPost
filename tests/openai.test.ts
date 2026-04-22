import test from "node:test";
import assert from "node:assert/strict";
import { getOllamaTimeoutForInput } from "../lib/openai.ts";
import { parseGeneratedPostJson } from "../lib/openai.shared.ts";

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

test("parseGeneratedPostJson preserves valid CSS and URLs inside JSON strings", () => {
  const rawJson = JSON.stringify({
    caption: "Legenda",
    hashtags: ["#um", "#dois", "#tres"],
    html: "<section><a href=\"https://example.com/path\">CTA</a></section>",
    css: ".cta { color: #ff751f; background: url(\"https://example.com/bg.png\"); }"
  });

  const parsed = parseGeneratedPostJson(rawJson) as { html: string; css: string };

  assert.match(parsed.html, /https:\/\/example\.com\/path/);
  assert.match(parsed.css, /background: url/);
  assert.match(parsed.css, /https:\/\/example\.com\/bg\.png/);
});

test("parseGeneratedPostJson repairs unescaped newlines inside strings", () => {
  const parsed = parseGeneratedPostJson(
    '{"caption":"Linha 1\nLinha 2","hashtags":["#um","#dois","#tres"],"html":"<section>ok</section>","css":"body { color: red; }"}'
  ) as { caption: string };

  assert.equal(parsed.caption, "Linha 1\nLinha 2");
});
