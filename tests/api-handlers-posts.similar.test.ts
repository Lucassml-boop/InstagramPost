import test from "node:test";
import assert from "node:assert/strict";
import { handleGeneratePost } from "../lib/api-handlers/posts.ts";

const user = { id: "user_123" };

test("handleGeneratePost returns detailed similar-post error payload", async () => {
  const request = new Request("http://localhost/api/posts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "EcomForge Shopify performance",
      message: "Crie uma loja com foco em conversao",
      tone: "professional",
      brandColors: "#101828",
      keywords: "shopify conversao performance ux"
    })
  });

  const response = await handleGeneratePost(request, user, {
    generateInstagramPost: async () => {
      throw new Error("Should not generate when a similar post exists.");
    },
    generateInstagramCarouselPosts: async () => {
      throw new Error("Should not generate carousel when a similar post exists.");
    },
    renderPostImage: async () => {
      throw new Error("Should not render when a similar post exists.");
    },
    getPersistedPreviewUrl: (imageUrl) => imageUrl,
    createDraftPost: async () => {
      throw new Error("Should not create draft when a similar post exists.");
    },
    findSimilarManualPost: async () => ({
      id: "post_similar_123",
      createdAt: new Date("2026-04-14T10:00:00.000Z"),
      topic: "EcomForge criacao de lojas Shopify",
      message: "Crie uma loja com foco em conversao",
      keywords: "shopify conversao ux performance",
      matches: [
        {
          field: "topic",
          matchType: "similar",
          candidateValue: "EcomForge Shopify performance",
          existingValue: "EcomForge criacao de lojas Shopify"
        },
        {
          field: "message",
          matchType: "exact",
          candidateValue: "Crie uma loja com foco em conversao",
          existingValue: "Crie uma loja com foco em conversao"
        },
        {
          field: "keywords",
          matchType: "overlap",
          candidateValue: "shopify conversao performance ux",
          existingValue: "shopify conversao ux performance",
          overlapKeywords: ["shopify", "conversao", "performance", "ux"]
        }
      ]
    }),
    slugify: () => "slug"
  });

  const json = await response.json();

  assert.equal(response.status, 400);
  assert.equal(json.errorDetails.type, "similar-manual-post");
  assert.equal(json.errorDetails.similarPost.id, "post_similar_123");
  assert.equal(json.errorDetails.similarPost.href, "/scheduled-posts?highlightPostId=post_similar_123");
  assert.equal(json.errorDetails.similarPost.details[0].label, "Produto ou tema");
  assert.deepEqual(json.errorDetails.similarPost.details[2].overlapKeywords, [
    "shopify",
    "conversao",
    "performance",
    "ux"
  ]);
});

test("handleGeneratePost ignores similar-post check when explicitly allowed", async () => {
  const request = new Request("http://localhost/api/posts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "EcomForge Shopify performance",
      message: "Crie uma loja com foco em conversao",
      tone: "professional",
      brandColors: "#101828",
      keywords: "shopify conversao performance ux",
      allowSimilarPost: true
    })
  });

  let similarLookupCalled = false;

  const response = await handleGeneratePost(request, user, {
    generateInstagramPost: async () => ({
      caption: "Legenda liberada",
      hashtags: ["#shopify"],
      html: "<section>ok</section>",
      css: "body{}"
    }),
    generateInstagramCarouselPosts: async () => {
      throw new Error("Should not call carousel generator.");
    },
    renderPostImage: async () => ({
      publicPath: "/generated/ok.jpg",
      absolutePath: "/tmp/ok.jpg"
    }),
    getPersistedPreviewUrl: (imageUrl) => `${imageUrl}?preview=1`,
    createDraftPost: async (input) => ({
      id: "post_allowed_123",
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
      htmlLayout: input.htmlLayout
    }),
    findSimilarManualPost: async () => {
      similarLookupCalled = true;
      return {
        id: "post_similar_123",
        createdAt: new Date("2026-04-14T10:00:00.000Z"),
        topic: "EcomForge criacao de lojas Shopify",
        message: "Crie uma loja com foco em conversao",
        keywords: "shopify conversao ux performance",
        matches: []
      };
    },
    slugify: () => "allowed"
  });

  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.postId, "post_allowed_123");
  assert.equal(similarLookupCalled, false);
});
