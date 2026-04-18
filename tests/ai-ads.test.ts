import assert from "node:assert/strict";
import test from "node:test";
import { AI_ADS_SAMPLE_INPUT, analyzeAiAdsInput } from "../lib/ai-ads.ts";

test("ai ads analysis caps budget increases and recommends scale for strong campaigns", () => {
  const input = {
    ...AI_ADS_SAMPLE_INPUT,
    safetyRules: {
      ...AI_ADS_SAMPLE_INPUT.safetyRules,
      maxBudgetIncreasePct: 10
    }
  };

  const analysis = analyzeAiAdsInput(input);
  const scaleCampaign = analysis.decisions.find((item) => item.campaignId === "cmp_scale_01");

  assert.ok(scaleCampaign);
  assert.equal(scaleCampaign.health, "scale");

  const budgetIncrease = scaleCampaign.approvedActions.find(
    (action) => action.type === "increase_budget"
  );

  assert.ok(budgetIncrease);
  assert.equal(budgetIncrease.approvedChangePct, 10);
});

test("ai ads analysis blocks pausing high-conversion campaigns", () => {
  const analysis = analyzeAiAdsInput(AI_ADS_SAMPLE_INPUT);
  const riskyCampaign = analysis.decisions.find((item) => item.campaignId === "cmp_creative_02");

  assert.ok(riskyCampaign);

  const blockedPause = riskyCampaign.blockedActions.find((action) => action.type === "pause");

  assert.ok(blockedPause);
  assert.match(
    blockedPause.safetyReason ?? "",
    /alto volume de conversao|revisao humana/i
  );
});

test("ai ads analysis protects new campaigns from structural changes", () => {
  const analysis = analyzeAiAdsInput(AI_ADS_SAMPLE_INPUT);
  const newCampaign = analysis.decisions.find((item) => item.campaignId === "cmp_new_03");

  assert.ok(newCampaign);
  assert.ok(newCampaign.health === "watch" || newCampaign.health === "optimize");
  assert.ok(
    newCampaign.approvedActions.some((action) => action.type === "keep_running") ||
      newCampaign.approvedActions.some((action) => action.type === "test_new_creative")
  );
  assert.equal(
    newCampaign.blockedActions.some((action) => action.type === "increase_budget"),
    false
  );
});
