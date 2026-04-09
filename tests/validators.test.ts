import test from "node:test";
import assert from "node:assert/strict";
import {
  deletePostsSchema,
  generatePostSchema,
  generationSettingsSchema,
  loginSchema,
  publishPostSchema,
  schedulePostSchema
} from "../lib/validators.ts";

test("loginSchema accepts valid credentials", () => {
  const parsed = loginSchema.parse({
    email: "reviewer@example.com",
    password: "123456"
  });

  assert.equal(parsed.email, "reviewer@example.com");
});

test("generatePostSchema applies defaults for optional fields", () => {
  const parsed = generatePostSchema.parse({
    topic: "Automacao",
    message: "Ganhe produtividade",
    tone: "professional",
    brandColors: "#101828, #d62976"
  });

  assert.equal(parsed.postType, "feed");
  assert.equal(parsed.carouselSlideCount, 3);
  assert.deepEqual(parsed.carouselSlideContexts, []);
  assert.equal(parsed.outputLanguage, "en");
  assert.equal(parsed.customInstructions, "");
  assert.equal(parsed.keywords, "");
});

test("generatePostSchema rejects carousel count outside range", () => {
  assert.throws(
    () =>
      generatePostSchema.parse({
        topic: "Automacao",
        message: "Ganhe produtividade",
        tone: "professional",
        postType: "carousel",
        carouselSlideCount: 11,
        brandColors: "#101828"
      }),
    /Number must be less than or equal to 10/
  );
});

test("generationSettingsSchema defaults to english and empty instructions", () => {
  const parsed = generationSettingsSchema.parse({});

  assert.equal(parsed.outputLanguage, "en");
  assert.equal(parsed.customInstructions, "");
});

test("publishPostSchema accepts captionless story payload", () => {
  const parsed = publishPostSchema.parse({
    postId: "post_123",
    caption: "",
    postType: "story",
    mediaItems: [
      {
        imageUrl: "/generated/story.jpg",
        imagePath: "/tmp/story.jpg"
      }
    ]
  });

  assert.equal(parsed.postType, "story");
  assert.equal(parsed.caption, "");
});

test("schedulePostSchema requires ISO datetime", () => {
  const parsed = schedulePostSchema.parse({
    postId: "post_123",
    caption: "Legenda",
    scheduledTime: "2026-04-10T14:30:00.000Z"
  });

  assert.equal(parsed.scheduledTime, "2026-04-10T14:30:00.000Z");
});

test("deletePostsSchema accepts multiple post ids", () => {
  const parsed = deletePostsSchema.parse({
    postIds: ["post_1", "post_2"]
  });

  assert.deepEqual(parsed.postIds, ["post_1", "post_2"]);
});
