import test from "node:test";
import assert from "node:assert/strict";
import {
  handleClearTopicsHistory,
  handleGetBrandProfile,
  handleGetTopicsHistory,
  handleUpdateBrandProfile
} from "../lib/api-handlers/content-system.ts";

const user = { id: "user_123" };

test("handleGetBrandProfile blocks unauthenticated requests", async () => {
  const response = await handleGetBrandProfile(null);
  const json = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(json, { error: "Unauthorized" });
});

test("handleGetBrandProfile returns stored profile", async () => {
  const response = await handleGetBrandProfile(user, {
    getContentBrandProfile: async () => ({
      brandName: "EcomForge",
      editableBrief: "brief",
      automationLoopEnabled: true,
      services: ["automacao"],
      weeklyAgenda: {
        Segunda: { goal: "goal", contentTypes: ["tip"], formats: ["carrossel"] }
      },
      carouselDefaultStructure: ["Hook"],
      contentRules: ["Nao repetir"],
      researchQueries: ["automacao"]
    }),
    updateContentBrandProfile: async () => {
      throw new Error("unused");
    },
    getContentTopicsHistory: async () => [],
    clearTopicsHistory: async () => {}
  });

  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.profile.brandName, "EcomForge");
});

test("handleUpdateBrandProfile returns validation errors as 400", async () => {
  const request = new Request("http://localhost/api/content-system/brand-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });

  const response = await handleUpdateBrandProfile(request, user, {
    getContentBrandProfile: async () => {
      throw new Error("unused");
    },
    updateContentBrandProfile: async () => {
      throw new Error("Invalid profile.");
    },
    getContentTopicsHistory: async () => [],
    clearTopicsHistory: async () => {}
  });

  const json = await response.json();

  assert.equal(response.status, 400);
  assert.equal(json.error, "Invalid profile.");
});

test("handleGetTopicsHistory returns compact topic list", async () => {
  const response = await handleGetTopicsHistory(user, {
    getContentBrandProfile: async () => {
      throw new Error("unused");
    },
    updateContentBrandProfile: async () => {
      throw new Error("unused");
    },
    getContentTopicsHistory: async () => ["automacao mercado livre", "dashboard vendas"],
    clearTopicsHistory: async () => {}
  });

  const json = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(json.topicsHistory, ["automacao mercado livre", "dashboard vendas"]);
});

test("handleClearTopicsHistory clears topic list", async () => {
  let cleared = false;

  const response = await handleClearTopicsHistory(user, {
    getContentBrandProfile: async () => {
      throw new Error("unused");
    },
    updateContentBrandProfile: async () => {
      throw new Error("unused");
    },
    getContentTopicsHistory: async () => [],
    clearTopicsHistory: async () => {
      cleared = true;
    }
  });

  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(cleared, true);
  assert.deepEqual(json.topicsHistory, []);
});
