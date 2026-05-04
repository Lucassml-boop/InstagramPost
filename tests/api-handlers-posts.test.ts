import test from "node:test";
import assert from "node:assert/strict";
import {
  handleGeneratePost,
  handlePublishPost
} from "../lib/api-handlers/posts.ts";

const user = { id: "user_123" };

test("handleGeneratePost returns 401 when user is missing", async () => {
  const request = new Request("http://localhost/api/posts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  const response = await handleGeneratePost(request, null);
  const json = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(json, { error: "Unauthorized" });
});

test("handleGeneratePost generates carousel draft with rendered media", async () => {
  const request = new Request("http://localhost/api/posts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "Automacao",
      message: "Ganhe produtividade",
      tone: "professional",
      postType: "carousel",
      carouselSlideCount: 2,
      carouselSlideContexts: ["hook", "cta"],
      brandColors: "#101828"
    })
  });

  const response = await handleGeneratePost(request, user, {
    generateInstagramPost: async () => {
      throw new Error("Should not call single post generator.");
    },
    generateInstagramCarouselPosts: async () => ({
      caption: "Legenda principal",
      hashtags: ["#automacao", "#marketplace", "#ecommerce"],
      slides: [
        { html: "<section>1</section>", css: "body{}", styleGuide: "bold" },
        { html: "<section>2</section>", css: "body{}", styleGuide: "bold" }
      ]
    }),
    renderPostImage: async ({ slug }) => ({
      publicPath: `/generated/${slug}.jpg`,
      absolutePath: `/tmp/${slug}.jpg`
    }),
    getPersistedPreviewUrl: (imageUrl) => `${imageUrl}?preview=1`,
    createDraftPost: async (input) => ({
      id: "post_123",
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
      htmlLayout: input.htmlLayout
    }),
    slugify: () => "automacao"
  });

  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.postId, "post_123");
  assert.equal(json.postType, "carousel");
  assert.equal(json.mediaItems.length, 2);
  assert.equal(json.mediaItems[0].imageUrl, "/generated/automacao-1.jpg");
});

test("handleGeneratePost maps timeout errors to 504", async () => {
  const request = new Request("http://localhost/api/posts/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: "Automacao",
      message: "Ganhe produtividade",
      tone: "professional",
      brandColors: "#101828"
    })
  });

  const response = await handleGeneratePost(request, user, {
    generateInstagramPost: async () => {
      throw new Error("Ollama request timed out after 480 seconds.");
    },
    generateInstagramCarouselPosts: async () => {
      throw new Error("Should not call carousel generator.");
    },
    renderPostImage: async () => {
      throw new Error("Should not render.");
    },
    getPersistedPreviewUrl: (imageUrl) => imageUrl,
    createDraftPost: async () => {
      throw new Error("Should not draft.");
    },
    slugify: () => "slug"
  });

  const json = await response.json();

  assert.equal(response.status, 504);
  assert.equal(json.error, "Ollama request timed out after 480 seconds.");
});

test("handlePublishPost returns 401 when user is missing", async () => {
  const request = new Request("https://example.com/api/posts/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: "post_123", caption: "" })
  });

  const response = await handlePublishPost(request, null, "https://example.com");
  const json = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(json, { error: "Unauthorized" });
});

test("handlePublishPost forwards parsed data and origin", async () => {
  const request = new Request("https://example.com/api/posts/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postId: "post_123",
      caption: "Legenda",
      postType: "carousel",
      mediaItems: [
        { imageUrl: "/generated/1.jpg", imagePath: "/tmp/1.jpg" },
        { imageUrl: "/generated/2.jpg", imagePath: "/tmp/2.jpg" }
      ]
    })
  });

  let capturedOrigin = "";
  let capturedPostId = "";

  const response = await handlePublishPost(request, user, "https://example.com", {
    publishPostNow: async (input) => {
      capturedOrigin = input.requestOrigin ?? "";
      capturedPostId = input.postId;
      return { id: "post_123" } as { id: string };
    }
  });

  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(capturedOrigin, "https://example.com");
  assert.equal(capturedPostId, "post_123");
});
