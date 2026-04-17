export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ENABLE_POST_SCHEDULER_IN_DEV !== "true"
    ) {
      console.info("[scheduler] Skipping automatic scheduler startup in development");
      return;
    }

    try {
      const { startPostScheduler } = await import("@/lib/scheduler");
      startPostScheduler();
    } catch (error) {
      console.error("[scheduler] Failed to start scheduler during initialization:", error);
      // Don't throw - allow app to start even if scheduler fails
    }
  }
}
