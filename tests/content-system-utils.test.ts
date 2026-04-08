import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTopicsHistoryEntries,
  getUpcomingWeekKey,
  isSameOrSimilarTopic,
  normalizeTopic,
  shouldSkipAutomationLoop
} from "../lib/content-system-utils.ts";

const DAY_ORDER = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"] as const;

type ContentPlanItem = {
  date: string;
  day: string;
  goal: string;
  type: string;
  format: string;
  theme: string;
  structure: string[];
  caption: string;
  visualIdea: string;
  cta: string;
  topicKeywords: string[];
};

function createAgenda(dates: string[], themes: string[]): ContentPlanItem[] {
  return dates.map((date, index) => ({
    date,
    day: DAY_ORDER[index] ?? "Segunda",
    goal: "goal",
    type: "type",
    format: "format",
    theme: themes[index] ?? `Theme ${index + 1}`,
    structure: ["Slide 1", "Slide 2", "Slide 3"],
    caption: "caption",
    visualIdea: "visual",
    cta: "cta",
    topicKeywords: ["automacao", "marketplace"]
  }));
}

test("normalizeTopic removes accents and punctuation", () => {
  assert.equal(normalizeTopic("Integração Mercado Livre!"), "integracao mercado livre");
});

test("isSameOrSimilarTopic detects similar subjects", () => {
  assert.equal(
    isSameOrSimilarTopic("automacao mercado livre", "mercado livre automacao"),
    true
  );
  assert.equal(isSameOrSimilarTopic("crm b2b", "estoque shopee"), false);
});

test("buildTopicsHistoryEntries stores compact normalized topics", () => {
  const entries = buildTopicsHistoryEntries(
    createAgenda(["2026-04-13"], ["Automação Mercado Livre"]).map((item) => ({
      ...item,
      topicKeywords: ["Integração Estoque", "Shopee"]
    }))
  );

  assert.deepEqual(entries, [
    "automacao mercado livre",
    "integracao estoque",
    "shopee"
  ]);
});

test("shouldSkipAutomationLoop skips when next week is already present", () => {
  const referenceDate = new Date("2026-04-08T12:00:00.000Z");
  const nextWeekDates = getUpcomingWeekKey(referenceDate, DAY_ORDER).split("|");
  const currentAgenda = createAgenda(nextWeekDates, [
    "Tema 1",
    "Tema 2",
    "Tema 3",
    "Tema 4",
    "Tema 5"
  ]);

  assert.equal(shouldSkipAutomationLoop(currentAgenda, referenceDate, DAY_ORDER), true);
});

test("shouldSkipAutomationLoop keeps running when agenda belongs to another week", () => {
  const referenceDate = new Date("2026-04-08T12:00:00.000Z");
  const currentAgenda = createAgenda(
    ["2026-04-06", "2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10"],
    ["Tema 1", "Tema 2", "Tema 3", "Tema 4", "Tema 5"]
  );

  assert.equal(shouldSkipAutomationLoop(currentAgenda, referenceDate, DAY_ORDER), false);
});
