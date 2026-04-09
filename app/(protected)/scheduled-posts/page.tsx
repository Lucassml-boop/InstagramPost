import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { PostStatus } from "@prisma/client";
import { ScheduledPostsTable } from "@/components/ScheduledPostsTable";
import { Panel, SectionTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import { fetchInstagramFeedMedia } from "@/lib/instagram";
import { prisma } from "@/lib/prisma";
import {
  getOptimizedAssetUrl,
  isRemoteAssetPath,
  isRemoteAssetUrl
} from "@/lib/storage";

function getStoredPreviewUrl(mediaItems: unknown, fallbackImageUrl: string) {
  if (Array.isArray(mediaItems)) {
    const firstItem = mediaItems[0];

    if (firstItem && typeof firstItem === "object") {
      const candidate = firstItem as { previewUrl?: unknown; imageUrl?: unknown };

      if (typeof candidate.previewUrl === "string" && candidate.previewUrl) {
        return candidate.previewUrl;
      }

      if (typeof candidate.imageUrl === "string" && candidate.imageUrl) {
        return candidate.imageUrl;
      }
    }
  }

  return fallbackImageUrl;
}

async function getAssetState(imagePath: string, imageUrl: string) {
  if (isRemoteAssetUrl(imageUrl)) {
    return "remote" as const;
  }

  if (!imagePath) {
    return "deleted" as const;
  }

  if (isRemoteAssetPath(imagePath)) {
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
  let instagramFeedItems: Awaited<ReturnType<typeof fetchInstagramFeedMedia>> = [];
  let instagramFeedError: string | null = null;
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
      imageUrl: getOptimizedAssetUrl(getStoredPreviewUrl(post.mediaItems, post.imageUrl), {
        width: 160,
        height: 160,
        quality: 70,
        resize: "cover"
      }),
      postType: post.postType,
      status: post.status as "SCHEDULED" | "PUBLISHED" | "FAILED",
      scheduledTime: post.scheduledTime?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      assetState: await getAssetState(post.imagePath, post.imageUrl)
    }))
  );

  try {
    instagramFeedItems = await fetchInstagramFeedMedia(user!.id, 12);
  } catch (error) {
    instagramFeedError =
      error instanceof Error ? error.message : dictionary.scheduledPage.instagramFeedError;
  }

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
          instagramFeedItems={instagramFeedItems}
          instagramFeedError={instagramFeedError}
          locale={locale}
          dictionary={dictionary.scheduledPage}
          generatorDictionary={dictionary.generator}
        />
      </Panel>
    </div>
  );
}
