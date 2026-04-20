"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Panel } from "@/components/shared";
import { publishNow } from "@/services/frontend/posts";
import type { WeeklyPostSummary } from "@/lib/content-system.agenda-status";
import { PostPreviewDialog } from "./PostPreviewDialog";
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
  status: "scheduled" | "publishing";
  plannedAt: Date;
  caption: string | null;
  imageUrl: string | null;
  previewUrl: string | null;
  brandColors: string | null;
  postType: string | null;
};

function isSchedulableStatus(
  status: string
): status is NextCountdownCandidate["status"] {
  return status === "scheduled" || status === "publishing";
}

function startOfNextDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + 1);
  return next;
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
      plannedAt: new Date(agendaItem.linkedScheduledTime ?? `${agendaItem.date}T${agendaItem.time}:00-03:00`),
      caption: agendaItem.linkedPostCaption ?? null,
      imageUrl: agendaItem.linkedPostImageUrl ?? null,
      previewUrl: agendaItem.linkedPostPreviewUrl ?? null,
      brandColors: agendaItem.linkedPostBrandColors ?? null,
      postType: agendaItem.linkedPostType ?? null
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
      plannedAt: new Date(post.scheduledTime ?? `${post.localDate}T${post.localTime}:00-03:00`),
      caption: post.caption,
      imageUrl: post.imageUrl,
      previewUrl: post.previewUrl,
      brandColors: post.brandColors,
      postType: post.postType
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
  weekPosts,
  queueSummary,
  queueDetails,
  activeQueueFilter,
  onQueueFilterChange,
  onClearQueued,
  onClearGenerating,
  onClearScheduled,
  isClearingQueue,
  clearingQueueStatus
}: {
  dictionary: AppDictionary;
  groupedAgenda: AgendaGroup[];
  weekPosts: WeeklyPostSummary[];
  queueSummary: {
    queued: number;
    generating: number;
    scheduled: number;
  };
  queueDetails: {
    queued: Array<{ id: string; title: string; meta: string }>;
    generating: Array<{ id: string; title: string; meta: string }>;
    scheduled: Array<{ id: string; title: string; meta: string }>;
  };
  activeQueueFilter: "queued" | "generating" | "scheduled" | null;
  onQueueFilterChange: (filter: "queued" | "generating" | "scheduled" | null) => void;
  onClearQueued: () => void;
  onClearGenerating: () => void;
  onClearScheduled: () => void;
  isClearingQueue: boolean;
  clearingQueueStatus: "queued" | "generating" | "scheduled" | null;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [skipBeforeTimestamp, setSkipBeforeTimestamp] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeQueueFilter) {
      setIsQueueModalOpen(false);
    }
  }, [activeQueueFilter]);

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
      .filter(
        (item) =>
          Number.isFinite(item.plannedAt.getTime()) &&
          item.plannedAt.getTime() >= now &&
          (skipBeforeTimestamp === null || item.plannedAt.getTime() >= skipBeforeTimestamp)
      );

    const manualCandidates = weekPosts
      .filter(
        (post) =>
          post.scheduledTime &&
          isSchedulableStatus(post.status) &&
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
        plannedAt: parseAgendaDateTime(post.localDate, post.localTime),
        caption: post.caption,
        imageUrl: post.imageUrl,
        previewUrl: post.previewUrl,
        brandColors: post.brandColors,
        postType: post.postType
      }))
      .filter(
        (item) =>
          Number.isFinite(item.plannedAt.getTime()) &&
          item.plannedAt.getTime() >= now &&
          (skipBeforeTimestamp === null || item.plannedAt.getTime() >= skipBeforeTimestamp)
      );

    return [...agendaCandidates, ...manualCandidates]
      .sort((left, right) => left.plannedAt.getTime() - right.plannedAt.getTime())[0] ?? null;
  }, [groupedAgenda, now, skipBeforeTimestamp, weekPosts]);

  const countdown = nextPost ? formatCountdown(nextPost.plannedAt.getTime() - now) : null;
  const creationStatus = nextPost
    ? dictionary.contentAutomation.nextPostCreationReady
    : null;

  const toggleQueueFilter = (filter: "queued" | "generating" | "scheduled") => {
    const nextFilter = activeQueueFilter === filter ? null : filter;
    onQueueFilterChange(nextFilter);
    setIsQueueModalOpen(nextFilter !== null);
  };

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {dictionary.contentAutomation.nextPostQueueSummaryLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClearQueued}
              disabled={isClearingQueue || queueSummary.queued === 0}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClearingQueue && clearingQueueStatus === "queued"
                ? dictionary.contentAutomation.clearingQueue
                : dictionary.contentAutomation.clearQueuedButton}
            </button>
            <button
              type="button"
              onClick={onClearGenerating}
              disabled={isClearingQueue || queueSummary.generating === 0}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClearingQueue && clearingQueueStatus === "generating"
                ? dictionary.contentAutomation.clearingQueue
                : dictionary.contentAutomation.clearGeneratingButton}
            </button>
            <button
              type="button"
              onClick={onClearScheduled}
              disabled={isClearingQueue || queueSummary.scheduled === 0}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClearingQueue && clearingQueueStatus === "scheduled"
                ? dictionary.contentAutomation.clearingQueue
                : dictionary.contentAutomation.clearScheduledButton}
            </button>
          </div>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <QueueSummaryPill
            label={dictionary.contentAutomation.nextPostQueueQueuedCount}
            value={queueSummary.queued}
            active={activeQueueFilter === "queued"}
            onClick={() => toggleQueueFilter("queued")}
          />
          <QueueSummaryPill
            label={dictionary.contentAutomation.nextPostQueueGeneratingCount}
            value={queueSummary.generating}
            active={activeQueueFilter === "generating"}
            onClick={() => toggleQueueFilter("generating")}
          />
          <QueueSummaryPill
            label={dictionary.contentAutomation.nextPostQueueScheduledCount}
            value={queueSummary.scheduled}
            active={activeQueueFilter === "scheduled"}
            onClick={() => toggleQueueFilter("scheduled")}
          />
        </div>
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
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="mt-2 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <p className="text-sm font-semibold text-emerald-950">{creationStatus}</p>
                  <p className="mt-1 text-sm text-emerald-800">
                    {dictionary.contentAutomation.previewCreatedPost}
                  </p>
                </button>
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
              <button
                type="button"
                onClick={async () => {
                  if (!nextPost.id) return;
                  setIsPublishing(true);
                  try {
                    await publishNow(nextPost.id);
                    setSkipBeforeTimestamp(startOfNextDay(nextPost.plannedAt).getTime());
                    router.refresh();
                  } catch (error) {
                    alert(
                      error instanceof Error ? error.message : "Erro ao publicar o post."
                    );
                  } finally {
                    setIsPublishing(false);
                  }
                }}
                disabled={isPublishing || !nextPost.id}
                className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {isPublishing ? dictionary.contentAutomation.publishingNow : dictionary.contentAutomation.publishNowButton}
                </p>
              </button>
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
      {isClient && isQueueModalOpen && activeQueueFilter
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <button
                type="button"
                aria-label={dictionary.contentAutomation.closeQueueModal}
                onClick={() => {
                  setIsQueueModalOpen(false);
                  onQueueFilterChange(null);
                }}
                className="absolute inset-0 bg-slate-900/25 backdrop-blur-md"
              />
              <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6 rounded-2xl mx-4"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {dictionary.contentAutomation.queueModalTitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQueueModalOpen(false);
                      onQueueFilterChange(null);
                    }}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
                  >
                    {dictionary.contentAutomation.closeQueueModal}
                  </button>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {activeQueueFilter === "queued"
                    ? dictionary.contentAutomation.nextPostQueueQueuedCount
                    : activeQueueFilter === "generating"
                    ? dictionary.contentAutomation.nextPostQueueGeneratingCount
                    : dictionary.contentAutomation.nextPostQueueScheduledCount}
                </p>
                {queueDetails[activeQueueFilter].length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {dictionary.contentAutomation.queueItemsEmpty}
                  </p>
                ) : (
                  <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                    {queueDetails[activeQueueFilter].map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
      {nextPost ? (
        <PostPreviewDialog
          dictionary={dictionary}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={nextPost.title}
          caption={nextPost.caption}
          imageUrl={nextPost.imageUrl}
          previewUrl={nextPost.previewUrl}
          brandColors={nextPost.brandColors}
          postType={nextPost.postType}
        />
      ) : null}
    </Panel>
  );
}

function QueueSummaryPill({
  label,
  value,
  active,
  onClick
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${active ? "border-ink bg-slate-900 text-white" : "border-slate-200 bg-white/90 hover:border-slate-400"}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${active ? "text-white" : "text-ink"}`}>{value}</p>
    </button>
  );
}
