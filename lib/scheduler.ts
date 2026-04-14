import cron from "node-cron";
import { prepareUpcomingAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import {
  runTopicsHistoryCleanupAutomation,
  runWeeklyContentAutomationLoop
} from "@/lib/content-system";
import { refreshInstagramAccessTokens } from "@/lib/instagram";
import { processScheduledPosts } from "@/lib/posts";

declare global {
  // eslint-disable-next-line no-var
  var __postSchedulerStarted__: boolean | undefined;
}

export function startPostScheduler() {
  if (global.__postSchedulerStarted__) {
    return;
  }

  global.__postSchedulerStarted__ = true;
  const timezone = process.env.TZ?.trim() || "America/Sao_Paulo";

  console.info("[scheduler] Starting post scheduler", {
    timezone,
    environment: process.env.NODE_ENV ?? "unknown"
  });

  cron.schedule("* * * * *", async () => {
    try {
      await prepareUpcomingAgendaPosts();
      await processScheduledPosts();
    } catch (error) {
      console.error("Scheduled post processor failed", error);
    }
  }, {
    timezone,
    noOverlap: true
  });

  cron.schedule("0 4 * * *", async () => {
    try {
      await refreshInstagramAccessTokens();
    } catch (error) {
      console.error("Instagram token refresh scheduler failed", error);
    }
  }, {
    timezone,
    noOverlap: true
  });

  cron.schedule("0 9 * * 0", async () => {
    try {
      await runWeeklyContentAutomationLoop();
    } catch (error) {
      console.error("Weekly content generation scheduler failed", error);
    }
  }, {
    timezone,
    noOverlap: true
  });

  cron.schedule("0 3 * * *", async () => {
    try {
      await runTopicsHistoryCleanupAutomation();
    } catch (error) {
      console.error("Topics history cleanup scheduler failed", error);
    }
  }, {
    timezone,
    noOverlap: true
  });
}
