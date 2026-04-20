import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSameOrSimilarTopic, normalizeTopic } from "@/lib/content-system-utils";
import {
  getAbsoluteAssetUrl,
  publishInstagramPost,
  type InstagramPostType,
  type PublishableMediaItem
} from "@/lib/instagram";

function parseStoredMediaItems(
  mediaItems: unknown,
  fallback: { imageUrl: string; imagePath: string }
): PublishableMediaItem[] {
  if (Array.isArray(mediaItems)) {
    const parsed = mediaItems
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as {
          imageUrl?: unknown;
          imagePath?: unknown;
          previewUrl?: unknown;
        };

        if (typeof candidate.imageUrl !== "string" || typeof candidate.imagePath !== "string") {
          return null;
        }

        return {
          imageUrl: candidate.imageUrl,
          imagePath: candidate.imagePath,
          ...(typeof candidate.previewUrl === "string"
            ? { previewUrl: candidate.previewUrl }
            : {})
        } satisfies PublishableMediaItem;
      })
      .filter((item): item is PublishableMediaItem => Boolean(item));

    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [fallback];
}

function getStoredPostType(postType: string | null | undefined): InstagramPostType {
  if (postType === "STORY") {
    return "story";
  }

  if (postType === "CAROUSEL") {
    return "carousel";
  }

  return "feed";
}

function ensureHashPrefix(tag: string) {
  const cleaned = tag.trim();
  if (!cleaned) {
    return "";
  }

  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

function buildFallbackCaption(post: { topic: string; message: string; hashtags: string }) {
  const topic = post.topic.trim();
  const message = post.message.trim();
  const hashtags = post.hashtags
    .split(/\s+/)
    .map(ensureHashPrefix)
    .filter((tag) => tag.length > 0)
    .slice(0, 10)
    .join(" ");

  const body = [topic, message].filter((value) => value.length > 0).join("\n\n");
  const captionBody = body || "Novo conteudo publicado automaticamente.";

  return hashtags ? `${captionBody}\n\n${hashtags}` : captionBody;
}

function normalizeManualField(value: string | null | undefined) {
  return normalizeTopic(value ?? "");
}

function getKeywordOverlap(candidateKeywords: string, existingKeywords: string) {
  const candidateSet = new Set(
    candidateKeywords
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item.length >= 3)
  );
  const existingSet = new Set(
    existingKeywords
      .split(" ")
      .map((item) => item.trim())
      .filter((item) => item.length >= 3)
  );

  const overlap: string[] = [];

  for (const keyword of candidateSet) {
    if (existingSet.has(keyword)) {
      overlap.push(keyword);
    }
  }

  return overlap;
}

export type SimilarManualPostMatchField = "topic" | "message" | "keywords";

export type SimilarManualPostMatch = {
  field: SimilarManualPostMatchField;
  matchType: "exact" | "similar" | "overlap";
  candidateValue: string;
  existingValue: string;
  overlapKeywords?: string[];
};

export type SimilarManualPostResult = {
  id: string;
  createdAt: Date;
  topic: string;
  message: string;
  keywords: string | null;
  matches: SimilarManualPostMatch[];
};

export async function findSimilarManualPost(input: {
  userId: string;
  topic: string;
  message: string;
  keywords?: string;
}): Promise<SimilarManualPostResult | null> {
  const candidateTopic = normalizeManualField(input.topic);
  const candidateMessage = normalizeManualField(input.message);
  const candidateKeywords = normalizeManualField(input.keywords);

  const posts = await prisma.post.findMany({
    where: {
      userId: input.userId
    },
    select: {
      id: true,
      topic: true,
      message: true,
      keywords: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });

  for (const post of posts) {
    const existingTopic = normalizeManualField(post.topic);
    const existingMessage = normalizeManualField(post.message);
    const existingKeywords = normalizeManualField(post.keywords);
    const sameTopic = isSameOrSimilarTopic(candidateTopic, existingTopic);
    const sameMessage =
      candidateMessage === existingMessage ||
      isSameOrSimilarTopic(candidateMessage, existingMessage);
    const keywordOverlap = getKeywordOverlap(candidateKeywords, existingKeywords);
    const sameKeywords =
      candidateKeywords.length > 0 &&
      existingKeywords.length > 0 &&
      (candidateKeywords === existingKeywords || keywordOverlap.length >= 2);

    if (!(sameTopic && (sameMessage || sameKeywords))) {
      continue;
    }

    const matches: SimilarManualPostMatch[] = [
      {
        field: "topic",
        matchType: candidateTopic === existingTopic ? "exact" : "similar",
        candidateValue: input.topic.trim(),
        existingValue: post.topic.trim()
      }
    ];

    if (sameMessage) {
      matches.push({
        field: "message",
        matchType: candidateMessage === existingMessage ? "exact" : "similar",
        candidateValue: input.message.trim(),
        existingValue: post.message.trim()
      });
    }

    if (sameKeywords) {
      matches.push({
        field: "keywords",
        matchType: candidateKeywords === existingKeywords ? "exact" : "overlap",
        candidateValue: (input.keywords ?? "").trim(),
        existingValue: (post.keywords ?? "").trim(),
        ...(keywordOverlap.length > 0 ? { overlapKeywords: keywordOverlap } : {})
      });
    }

    return {
      id: post.id,
      createdAt: post.createdAt,
      topic: post.topic,
      message: post.message,
      keywords: post.keywords,
      matches
    };
  }

  return null;
}

export async function createDraftPost(input: {
  userId: string;
  topic: string;
  message: string;
  tone: string;
  postType: InstagramPostType;
  brandColors: string;
  keywords?: string;
  caption: string;
  hashtags: string[];
  htmlLayout: string;
  mediaItems: PublishableMediaItem[];
  imageUrl: string;
  imagePath: string;
}) {
  return prisma.post.create({
    data: {
      userId: input.userId,
      topic: input.topic,
      message: input.message,
      tone: input.tone,
      postType: input.postType.toUpperCase() as "FEED" | "STORY" | "CAROUSEL",
      brandColors: input.brandColors,
      keywords: input.keywords,
      caption: input.caption,
      hashtags: input.hashtags.join(" "),
      htmlLayout: input.htmlLayout,
      mediaItems: input.mediaItems,
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
      status: PostStatus.DRAFT
    }
  });
}

export async function publishPostNow(input: {
  postId: string;
  userId: string;
  caption?: string;
  postType?: InstagramPostType;
  mediaItems?: PublishableMediaItem[];
  imageUrl?: string;
  imagePath?: string;
  requestOrigin?: string;
}) {
  const post = await prisma.post.findFirst({
    where: {
      id: input.postId,
      userId: input.userId
    }
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  const providedCaption = input.caption?.trim() ?? "";
  const storedCaption = post.caption.trim();
  const finalCaption =
    providedCaption.length > 0
      ? providedCaption
      : storedCaption.length > 0
        ? storedCaption
        : buildFallbackCaption(post);

  const fallbackMediaItem = {
    imageUrl: input.imageUrl ?? post.imageUrl,
    imagePath: input.imagePath ?? post.imagePath
  };
  const finalPostType = input.postType ?? getStoredPostType(post.postType);
  const mediaItems = input.mediaItems?.length
    ? input.mediaItems
    : parseStoredMediaItems(post.mediaItems, fallbackMediaItem);
  const normalizedMediaItems = mediaItems.map((item) => ({
    ...item,
    imageUrl: item.imageUrl.startsWith("http")
      ? item.imageUrl
      : getAbsoluteAssetUrl(item.imageUrl, input.requestOrigin)
  }));

  if (finalPostType === "carousel" && normalizedMediaItems.length < 2) {
    throw new Error("Carousel posts require at least 2 images.");
  }

  if (normalizedMediaItems.some((item) => item.imageUrl.includes("localhost") || item.imageUrl.includes("127.0.0.1"))) {
    throw new Error(
      "Nao foi possivel publicar no Instagram porque a imagem ainda esta apontando para localhost. O Instagram precisa de uma URL publica para baixar a imagem, entao use um APP_BASE_URL publico ou um tunel ativo."
    );
  }

  await prisma.post.update({
    where: { id: post.id },
    data: {
      caption: finalCaption,
      postType: finalPostType.toUpperCase() as "FEED" | "STORY" | "CAROUSEL",
      mediaItems,
      imageUrl: mediaItems[0]?.imageUrl ?? post.imageUrl,
      imagePath: mediaItems[0]?.imagePath ?? post.imagePath,
      status: PostStatus.PUBLISHING
    }
  });

  try {
    const published = await publishInstagramPost({
      userId: input.userId,
      postType: finalPostType,
      caption: finalCaption,
      mediaItems: normalizedMediaItems
    });

    return prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        postType: finalPostType.toUpperCase() as "FEED" | "STORY" | "CAROUSEL",
        mediaItems,
        caption: finalCaption,
        imageUrl: mediaItems[0]?.imageUrl ?? post.imageUrl,
        imagePath: mediaItems[0]?.imagePath ?? post.imagePath,
        publishedMediaId: published.mediaId,
        publishedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.FAILED,
        caption: finalCaption
      }
    });

    throw error;
  }
}

export async function schedulePost(input: {
  postId: string;
  userId: string;
  caption: string;
  scheduledTime: Date;
  postType?: InstagramPostType;
  mediaItems?: PublishableMediaItem[];
  imageUrl?: string;
  imagePath?: string;
}) {
  const coverImageUrl = input.mediaItems?.[0]?.imageUrl ?? input.imageUrl;
  const coverImagePath = input.mediaItems?.[0]?.imagePath ?? input.imagePath;

  return prisma.post.updateMany({
    where: {
      id: input.postId,
      userId: input.userId
    },
    data: {
      caption: input.caption,
      postType: input.postType?.toUpperCase() as "FEED" | "STORY" | "CAROUSEL" | undefined,
      mediaItems: input.mediaItems,
      imageUrl: coverImageUrl,
      imagePath: coverImagePath,
      scheduledTime: input.scheduledTime,
      status: PostStatus.SCHEDULED
    }
  });
}

export async function processScheduledPosts(requestOrigin?: string) {
  const duePosts = await prisma.post.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledTime: {
        lte: new Date()
      }
    }
  });

  for (const post of duePosts) {
    try {
      await publishPostNow({
        postId: post.id,
        userId: post.userId,
        caption: post.caption,
        requestOrigin
      });
    } catch {
      continue;
    }
  }

  return duePosts.length;
}

export async function deleteQueuedPosts(input: {
  userId: string;
  postIds: string[];
}) {
  const result = await prisma.post.deleteMany({
    where: {
      userId: input.userId,
      id: {
        in: input.postIds
      }
    }
  });

  return result.count;
}
