import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const contentSystemModuleUrl = pathToFileURL(path.join(repoRoot, "lib/content-system.ts")).href;

function createValidProfile() {
  return {
    brandName: "Forge Labs",
    editableBrief: "Marca focada em automacao comercial para ecommerce.",
    automationLoopEnabled: true,
    topicsHistoryCleanupFrequency: "weekly",
    services: ["Automacao", "Integracoes"],
    weeklyAgenda: {
      Segunda: {
        enabled: true,
        goal: "Gerar autoridade",
        contentTypes: ["Educacional"],
        formats: ["Carrossel"],
        postsPerDay: 1,
        postTimes: ["09:00"],
        postIdeas: [
          {
            goal: "Explicar beneficio",
            contentTypes: ["Educacional"],
            formats: ["Carrossel"]
          }
        ]
      }
    },
    carouselDefaultStructure: ["Hook", "Problema", "Solucao"],
    contentRules: ["Sem promessas exageradas"],
    researchQueries: ["automacao ecommerce"],
    goalPresets: ["Gerar demanda"],
    contentTypePresets: ["Educacional"],
    formatPresets: ["Carrossel"]
  };
}

test("content-system profile persists and topics cleanup reports cleared entries", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "content-system-test-"));
  const previousCwd = process.cwd();

  process.chdir(tempDir);

  try {
    const contentSystem = await import(contentSystemModuleUrl);
    const profile = createValidProfile();

    await contentSystem.updateContentBrandProfile(profile);
    const storedProfile = await contentSystem.getContentBrandProfile();

    assert.equal(storedProfile.brandName, profile.brandName);
    assert.equal(storedProfile.editableBrief, profile.editableBrief);

    await fs.mkdir(path.join(tempDir, "content-system"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "content-system", "topics_history.json"),
      JSON.stringify(["tema 1", "tema 2"], null, 2)
    );

    const cleared = await contentSystem.clearTopicsHistory();
    assert.deepEqual(cleared, { clearedEntries: 2 });
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("content-system cleanup automation skips when frequency does not match current day", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "content-system-test-"));
  const previousCwd = process.cwd();

  process.chdir(tempDir);

  try {
    const contentSystem = await import(`${contentSystemModuleUrl}?case=skip-cleanup`);
    const profile = createValidProfile();

    await contentSystem.updateContentBrandProfile(profile);

    const result = await contentSystem.runTopicsHistoryCleanupAutomation(
      new Date("2026-04-06T12:00:00.000Z")
    );

    assert.deepEqual(result, {
      ok: true,
      skipped: true,
      reason: "not-scheduled-today",
      frequency: "weekly"
    });
  } finally {
    process.chdir(previousCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
