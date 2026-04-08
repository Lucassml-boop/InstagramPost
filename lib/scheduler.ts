import cron from "node-cron";
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

  cron.schedule("* * * * *", async () => {
    try {
      await processScheduledPosts();
    } catch (error) {
      console.error("Scheduled post processor failed", error);
    }
  });

  cron.schedule("0 4 * * *", async () => {
    try {
      await refreshInstagramAccessTokens();
    } catch (error) {
      console.error("Instagram token refresh scheduler failed", error);
    }
  });
}
