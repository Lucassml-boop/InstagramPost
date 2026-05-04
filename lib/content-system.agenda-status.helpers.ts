import { PostStatus } from "@prisma/client";
import type { ContentPlanItem } from "./content-system.schemas.ts";
import type { AgendaPostGenerationStatus } from "./content-system.agenda-status.ts";

type OptionalPublicationState = "PUBLISHED" | "ARCHIVED" | "DELETED" | null | undefined;

const STATUS_PRIORITY: Record<Exclude<AgendaPostGenerationStatus, "not-generated">, number> = {
  published: 5,
  scheduled: 4,
  publishing: 3,
  draft: 2,
  failed: 1
};

export function mapPostStatus(status: PostStatus): Exclude<AgendaPostGenerationStatus, "not-generated"> {
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

export function getPublicationStateValue(post: {
  status: PostStatus;
  publicationState?: OptionalPublicationState;
}) {
  if (post.publicationState === "ARCHIVED" || post.publicationState === "DELETED") {
    return post.publicationState;
  }

  if (post.publicationState === "PUBLISHED") {
    return "PUBLISHED" as const;
  }

  return post.status === PostStatus.PUBLISHED ? "PUBLISHED" : null;
}

export function getPreviewUrlFromMedia(mediaItems: unknown, fallbackImageUrl: string | null | undefined) {
  if (Array.isArray(mediaItems)) {
    const firstItem = mediaItems[0];

    if (firstItem && typeof firstItem === "object") {
      const candidate = firstItem as { previewUrl?: unknown; imageUrl?: unknown };
      if (typeof candidate.previewUrl === "string" && candidate.previewUrl.trim()) {
        return candidate.previewUrl;
      }

      if (typeof candidate.imageUrl === "string" && candidate.imageUrl.trim()) {
        return candidate.imageUrl;
      }
    }
  }

  return fallbackImageUrl?.trim() ? fallbackImageUrl : null;
}

export function formatLocalDatePart(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

export function formatLocalTimePart(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);
}

export function startOfAgendaWeek(agenda: ContentPlanItem[]) {
  const minDate = agenda.map((item) => item.date).sort()[0];
  return new Date(`${minDate}T00:00:00-03:00`);
}

export function endOfAgendaWeek(agenda: ContentPlanItem[]) {
  const maxDate = agenda.map((item) => item.date).sort().at(-1) ?? agenda[0]?.date;
  return new Date(`${maxDate}T23:59:59-03:00`);
}

export function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function isCandidateForAgendaItem(
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
    return post.createdAt >= addDays(agendaWindow.start, -7) && post.createdAt <= addDays(agendaWindow.end, 7);
  }

  return false;
}

export function getCandidateScore(
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
