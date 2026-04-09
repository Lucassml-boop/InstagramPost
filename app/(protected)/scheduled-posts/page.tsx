import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { PostStatus } from "@prisma/client";
import { ScheduledPostsTable } from "@/components/ScheduledPostsTable";
import { Panel, SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";

async function getAssetState(imagePath: string) {
  if (!imagePath) {
    return "deleted" as const;
  }

  if (imagePath.startsWith("supabase://")) {
    return "remote" as const;
  }

  try {
    await access(imagePath, constants.F_OK);
    return "available" as const;
  } catch {
    return "deleted" as const;
  }
}

export default async function ScheduledPostsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);
  const params = await searchParams;
  const posts = await prisma.post.findMany({
    where: {
      userId: user!.id,
      status: {
        in: [PostStatus.SCHEDULED, PostStatus.PUBLISHED, PostStatus.FAILED]
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  const serializedPosts = await Promise.all(
    posts.map(async (post) => ({
      id: post.id,
      caption: post.caption,
      imageUrl: post.imageUrl,
      postType: post.postType,
      status: post.status as "SCHEDULED" | "PUBLISHED" | "FAILED",
      scheduledTime: post.scheduledTime?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      assetState: await getAssetState(post.imagePath)
    }))
  );

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.scheduledPage.eyebrow}
        title={dictionary.scheduledPage.title}
        description={dictionary.scheduledPage.description}
      />

      {params.saved ? (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {dictionary.scheduledPage.savedSuccess}
        </div>
      ) : null}

      <Panel className="mt-8 overflow-hidden">
        <ScheduledPostsTable
          posts={serializedPosts}
          locale={locale}
          dictionary={dictionary.scheduledPage}
          generatorDictionary={dictionary.generator}
        />
      </Panel>
    </div>
  );
}
