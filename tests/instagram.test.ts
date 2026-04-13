import test from "node:test";
import assert from "node:assert/strict";

test("getInstagramAuthUrl uses explicit redirect uri and keeps state", () => {
  process.env.INSTAGRAM_APP_ID = "app-123";
  process.env.INSTAGRAM_REDIRECT_URI = "https://fallback.example.com/callback";
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";
  process.env.DIRECT_URL = "postgresql://user:pass@localhost:5432/app";

  return import("../lib/instagram.ts").then(({ getInstagramAuthUrl }) => {
    const url = new URL(
      getInstagramAuthUrl("state-xyz", "https://app.example.com/api/auth/instagram/callback")
    );

    assert.equal(url.origin + url.pathname, "https://www.instagram.com/oauth/authorize");
    assert.equal(url.searchParams.get("client_id"), "app-123");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "https://app.example.com/api/auth/instagram/callback"
    );
    assert.equal(url.searchParams.get("state"), "state-xyz");
    assert.match(url.searchParams.get("scope") ?? "", /instagram_business_basic/);
    assert.match(url.searchParams.get("scope") ?? "", /instagram_business_content_publish/);
  });
});

test("getAbsoluteAssetUrl uses configured base url and falls back to request origin", () => {
  process.env.APP_BASE_URL = "https://configured.example.com";
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";
  process.env.DIRECT_URL = "postgresql://user:pass@localhost:5432/app";

  return import("../lib/instagram.ts").then(({ getAbsoluteAssetUrl }) => {
    assert.equal(
      getAbsoluteAssetUrl("uploads/post.jpg", "https://preview.example.com"),
      "https://configured.example.com/uploads/post.jpg"
    );

    delete process.env.APP_BASE_URL;

    assert.equal(
      getAbsoluteAssetUrl("uploads/post.jpg", "https://preview.example.com"),
      "https://preview.example.com/uploads/post.jpg"
    );
    assert.equal(
      getAbsoluteAssetUrl("/uploads/post.jpg", "https://preview.example.com"),
      "https://preview.example.com/uploads/post.jpg"
    );
  });
});

test("getInstagramAccountSnapshot returns plain stored fields", () => {
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/app";
  process.env.DIRECT_URL = "postgresql://user:pass@localhost:5432/app";

  return import("../lib/instagram.ts").then(({ getInstagramAccountSnapshot }) => {
    const snapshot = getInstagramAccountSnapshot({
      instagramUserId: "1789",
      instagramUserIdEncrypted: null,
      instagramUserIdIv: null,
      instagramUserIdTag: null,
      username: "brand.profile",
      usernameEncrypted: null,
      usernameIv: null,
      usernameTag: null,
      profilePictureUrl: "https://cdn.example.com/avatar.jpg",
      connected: true
    });

    assert.deepEqual(snapshot, {
      instagramUserId: "1789",
      username: "brand.profile",
      profilePictureUrl: "https://cdn.example.com/avatar.jpg",
      connected: true
    });
  });
});
