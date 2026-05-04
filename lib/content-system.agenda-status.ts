import { prisma } from "@/lib/prisma";
import { normalizeTopic } from "@/lib/content-system-utils";
import {
  addDays,
  endOfAgendaWeek,
  formatLocalDatePart,
  formatLocalTimePart,
  getCandidateScore,
  getPreviewUrlFromMedia,
  getPublicationStateValue,
  isCandidateForAgendaItem,
  mapPostStatus,
  startOfAgendaWeek
} from "./content-system.agenda-status.helpers.ts";
import type { ContentPlanItem } from "./content-system.schemas.ts";

export type AgendaPostGenerationStatus =
  | "not-generated"
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type ContentPlanItemWithStatus = ContentPlanItem & {
  linkedPostId: string | null;
  postGenerationStatus: AgendaPostGenerationStatus;
  linkedScheduledTime: string | null;
  linkedPublishedAt: string | null;
  linkedPublicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null;
  linkedPostCaption?: string | null;
  linkedPostImageUrl?: string | null;
  linkedPostPreviewUrl?: string | null;
  linkedPostBrandColors?: string | null;
  linkedPostType?: "FEED" | "STORY" | "CAROUSEL" | null;
};

export type WeeklyPostSummary = {
  id: string;
  topic: string;
  caption: string;
  status: Exclude<AgendaPostGenerationStatus, "not-generated">;
  publicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null;
  imageUrl: string | null;
  previewUrl: string | null;
  brandColors: string | null;
  postType: "FEED" | "STORY" | "CAROUSEL";
  scheduledTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  localDate: string;
  localTime: string;
};

export async function attachAgendaPostStatuses(
  userId: string,
  agenda: ContentPlanItem[]
): Promise<ContentPlanItemWithStatus[]> {
  if (agenda.length === 0) {
    return [];
  }

  const normalizedThemes = Array.from(
    new Set(agenda.map((item) => normalizeTopic(item.theme)).filter(Boolean))
  );
  const agendaWindow = {
    start: startOfAgendaWeek(agenda),
    end: endOfAgendaWeek(agenda)
  };

  const posts = await prisma.post.findMany({
    where: {
      userId,
      topic: {
        in: agenda.map((item) => item.theme)
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return agenda.map((item) => {
    const normalizedTheme = normalizeTopic(item.theme);
    const candidates = posts.filter(
      (post) =>
        normalizeTopic(post.topic) === normalizedTheme &&
        isCandidateForAgendaItem(post, item, agendaWindow)
    );
    const bestMatch = candidates.sort((left, right) => {
      return getCandidateScore(right, item) - getCandidateScore(left, item);
    })[0];

    if (!bestMatch || !normalizedThemes.includes(normalizedTheme)) {
      return {
        ...item,
        linkedPostId: null,
        postGenerationStatus: "not-generated",
        linkedScheduledTime: null,
        linkedPublishedAt: null,
        linkedPublicationState: null,
        linkedPostCaption: null,
        linkedPostImageUrl: null,
        linkedPostPreviewUrl: null,
        linkedPostBrandColors: null,
        linkedPostType: null
      };
    }

    return {
      ...item,
      linkedPostId: bestMatch.id,
      postGenerationStatus: mapPostStatus(bestMatch.status),
      linkedScheduledTime: bestMatch.scheduledTime?.toISOString() ?? null,
      linkedPublishedAt: bestMatch.publishedAt?.toISOString() ?? null,
      linkedPublicationState: getPublicationStateValue(bestMatch),
      linkedPostCaption: bestMatch.caption?.trim() || null,
      linkedPostImageUrl: bestMatch.imageUrl?.trim() || null,
      linkedPostPreviewUrl: getPreviewUrlFromMedia(bestMatch.mediaItems, bestMatch.imageUrl),
      linkedPostBrandColors: bestMatch.brandColors?.trim() || null,
      linkedPostType: bestMatch.postType ?? null
    };
  });
}

export async function getWeeklyPostsForAgenda(
  userId: string,
  agenda: ContentPlanItem[]
): Promise<WeeklyPostSummary[]> {
  if (agenda.length === 0) {
    return [];
  }

  const agendaStart = startOfAgendaWeek(agenda);
  const agendaEnd = endOfAgendaWeek(agenda);
  const posts = await prisma.post.findMany({
    where: {
      userId,
      OR: [
        {
          scheduledTime: {
            gte: agendaStart,
            lte: agendaEnd
          }
        },
        {
          publishedAt: {
            gte: agendaStart,
            lte: agendaEnd
          }
        },
        {
          createdAt: {
            gte: addDays(agendaStart, -1),
            lte: addDays(agendaEnd, 1)
          }
        }
      ]
    },
    orderBy: [
      { scheduledTime: "asc" },
      { createdAt: "asc" }
    ]
  });

  return posts.map((post) => {
    const baseDate = post.scheduledTime ?? post.publishedAt ?? post.createdAt;
    return {
      id: post.id,
      topic: post.topic,
      caption: post.caption,
      status: mapPostStatus(post.status),
      publicationState: getPublicationStateValue(post),
      imageUrl: post.imageUrl?.trim() || null,
      previewUrl: getPreviewUrlFromMedia(post.mediaItems, post.imageUrl),
      brandColors: post.brandColors?.trim() || null,
      postType: post.postType,
      scheduledTime: post.scheduledTime?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      localDate: formatLocalDatePart(baseDate),
      localTime: formatLocalTimePart(baseDate)
    };
  });
}
