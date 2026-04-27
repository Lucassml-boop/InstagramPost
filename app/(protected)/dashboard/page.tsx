import Link from "next/link";
import { redirect } from "next/navigation";
import { InstagramAccountCard } from "@/components/dashboard";
import { Panel, SectionTitle } from "@/components/shared";
import { getLatestAutomationRun } from "@/lib/automation-runs";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { getInstagramAccountSnapshot } from "@/lib/instagram";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ connected?: string; published?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const instagram = await prisma.instagramAccount.findUnique({
    where: { userId: user.id }
  });
  const instagramSnapshot = instagram ? getInstagramAccountSnapshot(instagram) : null;
  const [scheduledCount, publishedCount, failedCount, lastPublishCron] = await Promise.all([
    prisma.post.count({
      where: { userId: user.id, status: "SCHEDULED" }
    }),
    prisma.post.count({
      where: { userId: user.id, status: "PUBLISHED" }
    }),
    prisma.post.count({
      where: { userId: user.id, status: "FAILED" }
    }),
    getLatestAutomationRun("publish-scheduled")
  ]);
  const publicAssetBaseUrl = process.env.APP_BASE_URL ?? process.env.FIXED_PUBLIC_URL ?? "";
  const hasPublicAssetUrl =
    publicAssetBaseUrl.startsWith("https://") && !publicAssetBaseUrl.includes("localhost");
  const tokenExpiresAt = instagram?.tokenExpiresAt ?? null;
  const tokenExpiresSoon =
    Boolean(tokenExpiresAt) && tokenExpiresAt!.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  const needsAttention =
    !instagramSnapshot?.connected || !hasPublicAssetUrl || failedCount > 0 || tokenExpiresSoon;

  async function logoutAction() {
    "use server";
    await destroySession();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          eyebrow={dictionary.dashboard.eyebrow}
          title={dictionary.dashboard.title}
          description={dictionary.dashboard.description(user.email)}
        />
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
          >
            {dictionary.dashboard.logout}
          </button>
        </form>
      </div>

      {params.error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      {params.connected ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {dictionary.dashboard.connectedSuccess}
        </div>
      ) : null}

      {params.published ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {dictionary.dashboard.publishedSuccess}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Panel className="p-5">
          <p className="text-sm text-slate-500">{dictionary.dashboard.connectionStatus}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {instagramSnapshot?.connected ? dictionary.common.connected : dictionary.common.pending}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">{dictionary.dashboard.scheduledPosts}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{scheduledCount}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">{dictionary.dashboard.publishedPosts}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{publishedCount}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">{dictionary.dashboard.operationalHealth}</p>
          <p className={`mt-2 text-2xl font-semibold ${needsAttention ? "text-amber-700" : "text-emerald-700"}`}>
            {needsAttention ? dictionary.dashboard.attention : dictionary.dashboard.ready}
          </p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <p>
              {dictionary.dashboard.lastPublishCron}:{" "}
              {lastPublishCron?.startedAt
                ? lastPublishCron.startedAt.toLocaleString(locale)
                : dictionary.dashboard.never}
            </p>
            {!hasPublicAssetUrl ? <p>{dictionary.dashboard.publicUrlMissing}</p> : null}
            {tokenExpiresAt ? (
              <p>
                {dictionary.dashboard.tokenExpires}: {tokenExpiresAt.toLocaleDateString(locale)}
              </p>
            ) : null}
            {failedCount > 0 ? (
              <p>
                {dictionary.dashboard.failedPosts}: {failedCount}
              </p>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
        {instagramSnapshot ? (
          <InstagramAccountCard
            username={instagramSnapshot.username}
            instagramUserId={instagramSnapshot.instagramUserId}
            profilePictureUrl={instagramSnapshot.profilePictureUrl}
            connected={instagramSnapshot.connected}
            locale={locale}
          />
        ) : (
          <Panel className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {dictionary.dashboard.connectedAccount}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">{dictionary.dashboard.noAccountTitle}</h2>
            <p className="mt-3 text-sm text-slate-600">{dictionary.dashboard.noAccountDescription}</p>
            <Link
              href="/connect-instagram"
              className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {dictionary.dashboard.connectInstagram}
            </Link>
          </Panel>
        )}

        <Panel className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {dictionary.dashboard.quickActions}
          </p>
          <div className="mt-4 grid gap-3">
            <Link
              href="/create-post"
              className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {dictionary.dashboard.createPost}
            </Link>
            <Link
              href="/scheduled-posts"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              {dictionary.dashboard.viewScheduledPosts}
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
