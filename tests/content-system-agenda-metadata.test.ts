import test from "node:test";
import assert from "node:assert/strict";
import { summarizeWeeklyAgendaUsage } from "../lib/content-system.agenda-metadata.ts";

const baseAgenda = [
  {
    date: "2026-04-07",
    day: "Segunda",
    time: "09:00",
    goal: "Gerar autoridade",
    type: "tutorial",
    format: "Carrossel",
    theme: "Tema 1",
    structure: ["Hook", "Problema", "Solucao"],
    caption: "Legenda",
    visualIdea: "Visual",
    cta: "CTA",
    topicKeywords: ["tema"],
    linkedPostId: "post_1",
    postGenerationStatus: "published" as const,
    linkedScheduledTime: "2026-04-07T12:00:00.000Z",
    linkedPublishedAt: "2026-04-07T12:30:00.000Z",
    linkedPublicationState: "PUBLISHED" as const
  }
];

test("summarizeWeeklyAgendaUsage flags stale agenda with unused posts", () => {
  const summary = summarizeWeeklyAgendaUsage({
    agenda: baseAgenda,
    totalExpectedPosts: 2,
    metadata: {
      generatedAt: "2026-04-07T10:00:00.000Z",
      weekStartDate: "2026-04-07",
      weekEndDate: "2026-04-13",
      weekKey: "2026-04-07|2026-04-13",
      resolution: null,
      resolutionUpdatedAt: null
    },
    now: new Date("2026-04-20T12:00:00.000Z")
  });

  assert.equal(summary.weekState, "past");
  assert.equal(summary.hasUnusedPosts, true);
  assert.equal(summary.unusedPostsCount, 1);
  assert.equal(summary.shouldPromptReuse, true);
});

test("summarizeWeeklyAgendaUsage does not prompt after keep decision", () => {
  const summary = summarizeWeeklyAgendaUsage({
    agenda: baseAgenda,
    totalExpectedPosts: 2,
    metadata: {
      generatedAt: "2026-04-07T10:00:00.000Z",
      weekStartDate: "2026-04-07",
      weekEndDate: "2026-04-13",
      weekKey: "2026-04-07|2026-04-13",
      resolution: "KEEP_UNUSED",
      resolutionUpdatedAt: "2026-04-20T12:00:00.000Z"
    },
    now: new Date("2026-04-20T12:00:00.000Z")
  });

  assert.equal(summary.shouldPromptReuse, false);
});
