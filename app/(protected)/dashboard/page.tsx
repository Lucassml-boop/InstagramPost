import Link from "next/link";
import { InstagramAccountCard } from "@/components/InstagramAccountCard";
import { Panel, SectionTitle } from "@/components/ui";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ connected?: string; published?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const instagram = await prisma.instagramAccount.findUnique({
    where: { userId: user!.id }
  });
  const [scheduledCount, publishedCount] = await Promise.all([
    prisma.post.count({
      where: { userId: user!.id, status: "SCHEDULED" }
    }),
    prisma.post.count({
      where: { userId: user!.id, status: "PUBLISHED" }
    })
  ]);

  async function logoutAction() {
    "use server";
    await destroySession();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          eyebrow="Dashboard"
          title="Instagram publishing workspace"
          description={`Logged in as ${user!.email}. Connect the Instagram account, generate content with AI, preview it, and publish or schedule it for your Meta review flow.`}
        />
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
          >
            Logout
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
          Instagram account connected successfully.
        </div>
      ) : null}

      {params.published ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Post published successfully.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Connection status</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {instagram?.connected ? "Connected" : "Pending"}
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Scheduled posts</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{scheduledCount}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-sm text-slate-500">Published posts</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{publishedCount}</p>
        </Panel>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
        {instagram ? (
          <InstagramAccountCard
            username={instagram.username}
            instagramUserId={instagram.instagramUserId}
            profilePictureUrl={instagram.profilePictureUrl}
            connected={instagram.connected}
          />
        ) : (
          <Panel className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Connected Instagram Account
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">No account connected yet</h2>
            <p className="mt-3 text-sm text-slate-600">
              Connect an Instagram Professional account to unlock AI post generation and
              publishing.
            </p>
            <Link
              href="/connect-instagram"
              className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Connect Instagram
            </Link>
          </Panel>
        )}

        <Panel className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Quick actions
          </p>
          <div className="mt-4 grid gap-3">
            <Link
              href="/create-post"
              className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create Post
            </Link>
            <Link
              href="/scheduled-posts"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              View Scheduled Posts
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
