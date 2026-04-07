export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startPostScheduler } = await import("@/lib/scheduler");
    startPostScheduler();
  }
}
