import cron from "node-cron";
import { prepareUpcomingAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import {
  runTopicsHistoryCleanupAutomation,
  runWeeklyContentAutomationLoop
} from "@/lib/content-system";
import { refreshInstagramAccessTokens } from "@/lib/instagram";
import { processScheduledPosts } from "@/lib/posts";

declare global {
  var __postSchedulerStarted__: boolean | undefined;
}

function resolveSchedulerTimezone() {
  const rawTimezone = process.env.TZ?.trim();
  if (!rawTimezone) {
    return "America/Sao_Paulo";
  }

  const normalizedTimezone = rawTimezone.startsWith(":")
    ? rawTimezone.slice(1)
    : rawTimezone;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalizedTimezone });
    return normalizedTimezone;
  } catch {
    console.warn("[scheduler] Invalid timezone from environment, falling back", {
      rawTimezone,
      fallbackTimezone: "America/Sao_Paulo"
    });
    return "America/Sao_Paulo";
  }
}

export function startPostScheduler() {
  if (global.__postSchedulerStarted__) {
    return;
  }

  global.__postSchedulerStarted__ = true;
  const timezone = resolveSchedulerTimezone();

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
