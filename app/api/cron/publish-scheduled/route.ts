import { NextResponse } from "next/server";
import { ensureCronAccess } from "@/lib/cron-auth";
import { prepareUpcomingAgendaPosts } from "@/lib/weekly-agenda-scheduler";
import { processScheduledPosts } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { getRequestOrigin } from "@/lib/server-utils";

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

function formatSaoPauloDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}

function getSaoPauloDayRange(localDate: string) {
  const start = new Date(`${localDate}T00:00:00-03:00`);
  const end = new Date(`${localDate}T23:59:59.999-03:00`);
  return { start, end };
}

export async function POST(request: Request) {
  const unauthorizedResponse = await ensureCronAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const nextScheduledPost = await prisma.post.findFirst({
    where: {
      status: "SCHEDULED",
      scheduledTime: {
        not: null
      }
    },
    select: {
      id: true,
      scheduledTime: true
    },
    orderBy: {
      scheduledTime: "asc"
    }
  });

  if (!nextScheduledPost?.scheduledTime) {
    return NextResponse.json({
      skipped: true,
      reason: "no-scheduled-posts"
    });
  }

  const now = new Date();
  const nowLocalDate = formatSaoPauloDate(now);
  const nextLocalDate = formatSaoPauloDate(nextScheduledPost.scheduledTime);

  if (nextLocalDate !== nowLocalDate) {
    return NextResponse.json({
      skipped: true,
      reason: "next-post-not-today",
      nextScheduledPostId: nextScheduledPost.id,
      nextScheduledTime: nextScheduledPost.scheduledTime.toISOString()
    });
  }

  if (now.getTime() < nextScheduledPost.scheduledTime.getTime()) {
    return NextResponse.json({
      skipped: true,
      reason: "next-post-time-not-reached",
      nextScheduledPostId: nextScheduledPost.id,
      nextScheduledTime: nextScheduledPost.scheduledTime.toISOString()
    });
  }

  const todayRange = getSaoPauloDayRange(nowLocalDate);
  const publishedToday = await prisma.post.count({
    where: {
      status: "PUBLISHED",
      publishedAt: {
        gte: todayRange.start,
        lte: todayRange.end
      }
    }
  });

  if (publishedToday > 0) {
    return NextResponse.json({
      skipped: true,
      reason: "already-ran-today",
      publishedToday
    });
  }

  const preGeneration = await prepareUpcomingAgendaPosts();
  const count = await processScheduledPosts(getRequestOrigin(request));
  return NextResponse.json({
    processed: count,
    preGenerated: preGeneration.prepared,
    scannedAgendaItems: preGeneration.scanned
  });
}
