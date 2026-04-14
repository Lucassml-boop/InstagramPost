import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeTopic } from "@/lib/content-system-utils";
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
};

export type WeeklyPostSummary = {
  id: string;
  topic: string;
  caption: string;
  status: Exclude<AgendaPostGenerationStatus, "not-generated">;
  publicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null;
  scheduledTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  localDate: string;
  localTime: string;
};

const STATUS_PRIORITY: Record<Exclude<AgendaPostGenerationStatus, "not-generated">, number> = {
  published: 5,
  scheduled: 4,
  publishing: 3,
  draft: 2,
  failed: 1
};

function mapPostStatus(status: PostStatus): Exclude<AgendaPostGenerationStatus, "not-generated"> {
  if (status === PostStatus.PUBLISHED) {
    return "published";
  }

  if (status === PostStatus.SCHEDULED) {
    return "scheduled";
  }

  if (status === PostStatus.PUBLISHING) {
    return "publishing";
  }

  if (status === PostStatus.FAILED) {
    return "failed";
  }

  return "draft";
}

function formatLocalDatePart(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

function formatLocalTimePart(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

function startOfAgendaWeek(agenda: ContentPlanItem[]) {
  const minDate = agenda.map((item) => item.date).sort()[0];
  return new Date(`${minDate}T00:00:00-03:00`);
}

function endOfAgendaWeek(agenda: ContentPlanItem[]) {
  const maxDate = agenda.map((item) => item.date).sort().at(-1) ?? agenda[0]?.date;
  return new Date(`${maxDate}T23:59:59-03:00`);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function isCandidateForAgendaItem(
  post: {
    status: PostStatus;
    scheduledTime: Date | null;
    publishedAt: Date | null;
    createdAt: Date;
  },
  item: ContentPlanItem,
  agendaWindow: { start: Date; end: Date }
) {
  const scheduledDate = post.scheduledTime ? formatLocalDatePart(post.scheduledTime) : null;
  const publishedDate = post.publishedAt ? formatLocalDatePart(post.publishedAt) : null;

  if (scheduledDate === item.date || publishedDate === item.date) {
    return true;
  }

  if (
    post.status === PostStatus.DRAFT ||
    post.status === PostStatus.PUBLISHING ||
    post.status === PostStatus.FAILED
  ) {
    return (
      post.createdAt >= addDays(agendaWindow.start, -7) &&
      post.createdAt <= addDays(agendaWindow.end, 7)
    );
  }

  return false;
}

function getCandidateScore(
  post: {
    status: PostStatus;
    scheduledTime: Date | null;
    updatedAt: Date;
  },
  item: ContentPlanItem
) {
  let score = STATUS_PRIORITY[mapPostStatus(post.status)] * 100;

  if (post.scheduledTime) {
    const scheduledDate = formatLocalDatePart(post.scheduledTime);
    const scheduledTime = formatLocalTimePart(post.scheduledTime);

    if (scheduledDate === item.date) {
      score += 50;
    }

    if (scheduledDate === item.date && scheduledTime === item.time) {
      score += 100;
    }
  }

  return score + post.updatedAt.getTime() / 1_000_000_000_000;
}

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
    select: {
      id: true,
      topic: true,
      status: true,
      publicationState: true,
      scheduledTime: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
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
        linkedPublicationState: null
      };
    }

    return {
      ...item,
      linkedPostId: bestMatch.id,
      postGenerationStatus: mapPostStatus(bestMatch.status),
      linkedScheduledTime: bestMatch.scheduledTime?.toISOString() ?? null,
      linkedPublishedAt: bestMatch.publishedAt?.toISOString() ?? null,
      linkedPublicationState: bestMatch.publicationState ?? null
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
    select: {
      id: true,
      topic: true,
      caption: true,
      status: true,
      publicationState: true,
      scheduledTime: true,
      publishedAt: true,
      createdAt: true
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
      publicationState: post.publicationState ?? null,
      scheduledTime: post.scheduledTime?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      localDate: formatLocalDatePart(baseDate),
      localTime: formatLocalTimePart(baseDate)
    };
  });
}
