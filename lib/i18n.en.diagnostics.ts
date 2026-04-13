export const enDiagnosticsDictionary = {
automationDiagnostics: {
  eyebrow: "Diagnostics",
  title: "Automation diagnostics",
  description:
    "Run the cron automations manually and inspect the live response without waiting for the scheduled time.",
  helpTitle: "How to use this page",
  helpDescription:
    "Each action below triggers the same backend automation used by the scheduler. Run one action at a time and review the returned JSON to confirm the workflow is behaving correctly.",
  generateWeeklyTitle: "Generate weekly content agenda",
  generateWeeklyDescription:
    "Runs the weekly content planning automation and shows whether the agenda was generated or skipped.",
  clearTopicsTitle: "Run topics history cleanup",
  clearTopicsDescription:
    "Runs the automatic topics history cleanup using the frequency configured in content automation settings.",
  publishScheduledTitle: "Publish scheduled posts",
  publishScheduledDescription:
    "Processes posts whose scheduled time has already arrived and attempts publication immediately.",
  publishWeeklyPreviewTitle: "Publish the whole weekly agenda now",
  publishWeeklyPreviewDescription:
    "Uses the current weekly agenda to generate and publish every item in sequence so you can inspect how the week would look in practice.",
  publishWeeklyPreviewDay: "Agenda day to publish",
  publishWeeklyPreviewAllDays: "Publish the full week",
  refreshTokensTitle: "Refresh Instagram tokens",
  refreshTokensDescription:
    "Refreshes saved Instagram access tokens for connected accounts.",
  runAction: "Run automation",
  running: "Running...",
  lastStatus: "Last status",
  notRunYet: "Not run yet",
  requestFailed: "The request failed.",
  summaryLabel: "Summary:",
  weeklySkipped: "the weekly plan was skipped because it already exists",
  cleanupSkipped: "cleanup skipped for today",
  itemsGenerated: "items generated",
  itemsCleared: "topics cleared",
  itemsProcessed: "scheduled posts processed",
  itemsPublished: "published",
  itemsFailed: "failed",
  tokensRefreshed: "tokens refreshed",
  awaitingRun: "Run this automation to see a human-readable summary here.",
  sectionRealtime: "Realtime feedback",
  sectionRealtimeDescription:
    "Every action returns the live backend response so you can validate the exact status without opening the terminal.",
  sectionSafety: "Safe testing",
  sectionSafetyDescription:
    "Use the day selector in the weekly publish test if you want to publish only one agenda item instead of the full week."
}
};
