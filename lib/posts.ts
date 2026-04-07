import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAbsoluteAssetUrl, publishInstagramImage } from "@/lib/instagram";

export async function createDraftPost(input: {
  userId: string;
  topic: string;
  message: string;
  tone: string;
  brandColors: string;
  keywords?: string;
  caption: string;
  hashtags: string[];
  htmlLayout: string;
  imageUrl: string;
  imagePath: string;
}) {
  return prisma.post.create({
    data: {
      userId: input.userId,
      topic: input.topic,
      message: input.message,
      tone: input.tone,
      brandColors: input.brandColors,
      keywords: input.keywords,
      caption: input.caption,
      hashtags: input.hashtags.join(" "),
      htmlLayout: input.htmlLayout,
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
      status: PostStatus.DRAFT
    }
  });
}

export async function publishPostNow(input: {
  postId: string;
  userId: string;
  caption: string;
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

  const finalImagePath = input.imageUrl ?? post.imageUrl;
  const imageUrl = getAbsoluteAssetUrl(finalImagePath, input.requestOrigin);

  if (imageUrl.includes("localhost") || imageUrl.includes("127.0.0.1")) {
    throw new Error(
      "Publishing requires a publicly reachable APP_BASE_URL or tunnel because Instagram must fetch the image_url."
    );
  }

  await prisma.post.update({
    where: { id: post.id },
    data: {
      caption: input.caption,
      imageUrl: input.imageUrl ?? post.imageUrl,
      imagePath: input.imagePath ?? post.imagePath,
      status: PostStatus.PUBLISHING
    }
  });

  try {
    const published = await publishInstagramImage({
      userId: input.userId,
      caption: input.caption,
      imageUrl
    });

    return prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.PUBLISHED,
        caption: input.caption,
        publishedMediaId: published.mediaId,
        publishedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: PostStatus.FAILED,
        caption: input.caption
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
  imageUrl?: string;
  imagePath?: string;
}) {
  return prisma.post.updateMany({
    where: {
      id: input.postId,
      userId: input.userId
    },
    data: {
      caption: input.caption,
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
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
