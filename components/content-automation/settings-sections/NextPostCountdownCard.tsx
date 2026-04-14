"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/shared";
import type { WeeklyPostSummary } from "@/lib/content-system.agenda-status";
import type { AgendaGroup, AppDictionary } from "./types";

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

function parseAgendaDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`);
}

function compareTimeStrings(left: string, right: string) {
  const leftMinutes = parseTimeToMinutes(left);
  const rightMinutes = parseTimeToMinutes(right);

  if (leftMinutes === null && rightMinutes === null) {
    return 0;
  }

  if (leftMinutes === null) {
    return 1;
  }

  if (rightMinutes === null) {
    return -1;
  }

  return leftMinutes - rightMinutes;
}

function normalizeTime(value: string) {
  return value.trim();
}

function parseTimeToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1] ?? "", 10) * 60 + Number.parseInt(match[2] ?? "", 10);
}

function findBestSlotIndex(
  slotTimes: string[],
  slots: Array<NextCountdownCandidate | null>,
  targetTime: string
) {
  const targetMinutes = parseTimeToMinutes(targetTime);
  const availableSlots = slots
    .map((slide, index) => ({ slide, index }))
    .filter((entry) => entry.slide === null);

  if (availableSlots.length === 0) {
    return -1;
  }

  const exactMatch = availableSlots.find(
    (entry) => normalizeTime(slotTimes[entry.index]) === normalizeTime(targetTime)
  );

  if (exactMatch) {
    return exactMatch.index;
  }

  if (targetMinutes === null) {
    return availableSlots[0]?.index ?? -1;
  }

  return (
    availableSlots
      .map((entry) => ({
        index: entry.index,
        diff:
          Math.abs((parseTimeToMinutes(slotTimes[entry.index]) ?? targetMinutes) - targetMinutes)
      }))
      .sort((left, right) => left.diff - right.diff || left.index - right.index)[0]?.index ?? -1
  );
}

type NextCountdownCandidate = {
  id: string;
  kind: "agenda" | "manual";
  day: string;
  slot: number;
  title: string;
  status: "scheduled" | "publishing" | "published";
  plannedAt: Date;
};

function isSchedulableStatus(
  status: string
): status is NextCountdownCandidate["status"] {
  return status === "scheduled" || status === "publishing" || status === "published";
}

function buildGroupCandidates(item: AgendaGroup): NextCountdownCandidate[] {
  const totalSlots = Math.max(item.expectedPostsCount, item.items.length + item.extraPosts.length, 1);
  const slotTimes = Array.from(
    { length: totalSlots },
    (_, index) => item.expectedTimes[index] ?? "--:--"
  );
  const expectedTimeSet = new Set(item.expectedTimes.map((value) => value.trim()));
  const slots = Array.from({ length: totalSlots }, () => null as NextCountdownCandidate | null);

  const sortedPlannedItems = [...item.items]
    .filter(
      (agendaItem) =>
        Boolean(agendaItem.linkedScheduledTime) &&
        isSchedulableStatus(agendaItem.postGenerationStatus)
    )
    .sort((left, right) => compareTimeStrings(left.time, right.time));
  const sortedExtraPosts = [...item.extraPosts]
    .filter(
      (post) =>
        Boolean(post.scheduledTime) &&
        isSchedulableStatus(post.status)
    )
    .sort((left, right) => compareTimeStrings(left.localTime, right.localTime));

  for (const agendaItem of sortedPlannedItems) {
    if (item.expectedPostsCount === 0 || !expectedTimeSet.has(agendaItem.time.trim())) {
      continue;
    }

    if (!isSchedulableStatus(agendaItem.postGenerationStatus)) {
      continue;
    }

    const slotIndex = findBestSlotIndex(slotTimes, slots, agendaItem.time);
    const candidate: NextCountdownCandidate = {
      id: agendaItem.linkedPostId ?? `${agendaItem.date}-${agendaItem.time}-${slotIndex}`,
      kind: "agenda",
      day: item.day,
      slot: slotIndex === -1 ? slots.length + 1 : slotIndex + 1,
      title: agendaItem.theme,
      status: agendaItem.postGenerationStatus,
      plannedAt: new Date(agendaItem.linkedScheduledTime ?? `${agendaItem.date}T${agendaItem.time}:00-03:00`)
    };

    if (slotIndex === -1) {
      slots.push(candidate);
      continue;
    }

    slots[slotIndex] = candidate;
  }

  for (const post of sortedExtraPosts) {
    if (!isSchedulableStatus(post.status)) {
      continue;
    }

    const slotIndex = findBestSlotIndex(slotTimes, slots, post.localTime);
    const candidate: NextCountdownCandidate = {
      id: post.id,
      kind: "manual",
      day: item.day,
      slot: slotIndex === -1 ? slots.length + 1 : slotIndex + 1,
      title: post.topic,
      status: post.status,
      plannedAt: new Date(post.scheduledTime ?? `${post.localDate}T${post.localTime}:00-03:00`)
    };

    if (slotIndex === -1) {
      slots.push(candidate);
      continue;
    }

    slots[slotIndex] = candidate;
  }

  return slots
    .map((slot, index) => {
      if (!slot) {
        return null;
      }

      return {
        ...slot,
        slot: index + 1
      };
    })
    .filter((slot): slot is NextCountdownCandidate => Boolean(slot));
}

function formatCountdown(totalMilliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMilliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatPlannedDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export function NextPostCountdownCard({
  dictionary,
  groupedAgenda,
  weekPosts
}: {
  dictionary: AppDictionary;
  groupedAgenda: AgendaGroup[];
  weekPosts: WeeklyPostSummary[];
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const nextPost = useMemo(() => {
    const linkedPostIds = new Set(
      groupedAgenda
        .flatMap((group) => group.items.map((item) => item.linkedPostId))
        .filter((value): value is string => Boolean(value))
    );
    const groupedExtraPostIds = new Set(
      groupedAgenda.flatMap((group) => group.extraPosts.map((post) => post.id))
    );

    const agendaCandidates = groupedAgenda
      .flatMap((group) => buildGroupCandidates(group))
      .filter((item) => Number.isFinite(item.plannedAt.getTime()) && item.plannedAt.getTime() >= now);

    const manualCandidates = weekPosts
      .filter(
        (post) =>
          post.scheduledTime &&
          !linkedPostIds.has(post.id) &&
          !groupedExtraPostIds.has(post.id)
      )
      .map((post) => ({
        kind: "manual" as const,
        id: post.id,
        day: "",
        slot: 1,
        title: post.topic,
        status: post.status,
        plannedAt: parseAgendaDateTime(post.localDate, post.localTime)
      }))
      .filter((item) => Number.isFinite(item.plannedAt.getTime()) && item.plannedAt.getTime() >= now);

    return [...agendaCandidates, ...manualCandidates]
      .sort((left, right) => left.plannedAt.getTime() - right.plannedAt.getTime())[0] ?? null;
  }, [groupedAgenda, now, weekPosts]);

  const countdown = nextPost ? formatCountdown(nextPost.plannedAt.getTime() - now) : null;
  const creationStatus = nextPost
    ? dictionary.contentAutomation.nextPostCreationReady
    : null;

  return (
    <Panel className="overflow-hidden border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_40%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-0">
      <div className="border-b border-slate-200/80 bg-white/70 px-6 py-5 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {dictionary.contentAutomation.nextPostTimerEyebrow}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.contentAutomation.nextPostTimerDescription}
        </p>
      </div>
      <div className="p-6">
        {nextPost ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-5">
              <p className="text-sm font-semibold text-slate-500">
                {dictionary.contentAutomation.nextPostTimerLabel}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {countdown}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                {formatPlannedDate(nextPost.plannedAt)}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {nextPost.title}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {dictionary.contentAutomation.nextPostCreationStatusLabel}
                </p>
                <p className="mt-2 text-sm font-semibold text-ink">{creationStatus}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {dictionary.contentAutomation.nextPostSlotLabel}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {nextPost.kind === "manual"
                    ? dictionary.contentAutomation.nextPostManualSlotLabel
                    : `${nextPost.day} · ${dictionary.contentAutomation.postLabel} ${nextPost.slot}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-5 py-6">
            <p className="text-sm font-semibold text-ink">
              {dictionary.contentAutomation.nextPostTimerEmptyTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.nextPostTimerEmptyDescription}
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}
