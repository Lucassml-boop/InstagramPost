"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/shared";
import { renderAgendaMeta } from "@/components/content-automation/helpers";
import type { AgendaGroup, AppDictionary } from "./types";

const STATUS_STYLES = {
  "not-generated": "border-slate-200 bg-slate-100 text-slate-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  publishing: "border-violet-200 bg-violet-50 text-violet-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700"
} as const;

export function GeneratedAgendaSection({
  dictionary,
  groupedAgenda,
  totalExpectedPosts,
  agendaSummary,
  keepUsingStaleAgenda,
  isResolvingStaleAgenda,
  activeQueueFilter,
  slotRuntimeStatusByKey
}: {
  dictionary: AppDictionary;
  groupedAgenda: AgendaGroup[];
  totalExpectedPosts: number;
  agendaSummary: {
    generatedAt: string | null;
    weekStartDate: string | null;
    weekEndDate: string | null;
    shouldPromptReuse: boolean;
    unusedPostsCount: number;
  };
  keepUsingStaleAgenda: () => void;
  isResolvingStaleAgenda: boolean;
  activeQueueFilter: "queued" | "generating" | "scheduled" | null;
  slotRuntimeStatusByKey: Record<
    string,
    "awaiting-confirmation" | "queued" | "generating-now" | "generated-and-scheduled" | "published" | "failed"
  >;
}) {
  const filteredGroups = activeQueueFilter
    ? groupedAgenda.filter((group) => {
        const matchingCount = group.expectedTimes.reduce((total, _, index) => {
          const key = `${group.day}-${index}`;
          const status = slotRuntimeStatusByKey[key];

          if (activeQueueFilter === "queued" && status === "queued") {
            return total + 1;
          }

          if (activeQueueFilter === "generating" && status === "generating-now") {
            return total + 1;
          }

          if (activeQueueFilter === "scheduled" && status === "generated-and-scheduled") {
            return total + 1;
          }

          return total;
        }, 0);

        return matchingCount > 0;
      })
    : groupedAgenda;
  const generatedCount = filteredGroups.reduce((total, group) => {
    return total + buildAgendaSlides(group).filter((slide) => slide.kind !== "missing").length;
  }, 0);
  const pendingCount = Math.max(totalExpectedPosts - generatedCount, 0);

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {dictionary.contentAutomation.generatedSection}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.contentAutomation.generatedDescription}
        </p>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              {dictionary.contentAutomation.generatedAgendaTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.generatedAgendaDescription}
            </p>
          </div>
          {filteredGroups.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              <SummaryPill
                label={dictionary.contentAutomation.generatedPostsCount}
                value={generatedCount}
              />
              <SummaryPill
                label={dictionary.contentAutomation.pendingPostsCount}
                value={pendingCount}
              />
            </div>
          ) : null}
        </div>
        {agendaSummary.generatedAt ? (
          <p className="mt-3 text-sm text-slate-500">
            {dictionary.contentAutomation.planGeneratedAtLabel} {formatDateTime(agendaSummary.generatedAt)}
            {agendaSummary.weekStartDate && agendaSummary.weekEndDate
              ? ` · ${dictionary.contentAutomation.planWeekLabel} ${agendaSummary.weekStartDate} a ${agendaSummary.weekEndDate}`
              : ""}
          </p>
        ) : null}
        {agendaSummary.shouldPromptReuse ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              {dictionary.contentAutomation.staleAgendaTitle}
            </p>
            <p className="mt-2 text-sm text-amber-800">
              {dictionary.contentAutomation.staleAgendaDescription} {agendaSummary.unusedPostsCount}.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={keepUsingStaleAgenda}
                disabled={isResolvingStaleAgenda}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResolvingStaleAgenda
                  ? dictionary.contentAutomation.resolvingStaleAgenda
                  : dictionary.contentAutomation.keepUnusedPosts}
              </button>
              <p className="self-center text-sm text-amber-900">
                {dictionary.contentAutomation.generateNewAgendaHint}
              </p>
            </div>
          </div>
        ) : null}
        {filteredGroups.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">{dictionary.contentAutomation.noAgenda}</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {filteredGroups.map((item) => (
              <AgendaGroupCard key={`${item.date}-${item.day}`} dictionary={dictionary} item={item} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function AgendaGroupCard({ dictionary, item }: { dictionary: AppDictionary; item: AgendaGroup }) {
  const slides = buildAgendaSlides(item);
  const filledPostsCount = slides.filter((slide) => slide.kind !== "missing").length;
  const missingPostsCount = slides.filter((slide) => slide.kind === "missing").length;
  const hasRealCoverageGap = filledPostsCount < item.expectedPostsCount;
  const [now, setNow] = useState(() => Date.now());
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const generationState = getGenerationState(item, slides, now);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          <span>{item.day}</span>
          <span>{item.date}</span>
          <span>
            {filledPostsCount} de {Math.max(item.expectedPostsCount, slides.length)}{" "}
            {item.expectedPostsCount === 1
              ? dictionary.contentAutomation.singlePostLabel
              : dictionary.contentAutomation.multiplePostsLabel}
          </span>
        </div>
        {generationState ? (
          <div className="min-w-[220px] rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              {dictionary.contentAutomation.preGeneratingBadge.replace(
                "{slot}",
                `${generationState.postNumber}/${item.expectedPostsCount}`
              )}
            </p>
            <p className="mt-1 text-sm text-sky-800">
              {dictionary.contentAutomation.preGeneratingCountdown.replace(
                "{time}",
                formatRemainingDuration(generationState.remainingMs)
              )}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-[width] duration-500"
                style={{ width: `${generationState.progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
      {hasRealCoverageGap ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {dictionary.contentAutomation.missingPlannedPostsNotice}{" "}
          {Math.max(item.expectedPostsCount - filledPostsCount, 0)}.
        </div>
      ) : null}

      {slides.length > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-sm font-medium text-slate-600">
            {dictionary.contentAutomation.carouselStatusLabel} {activeIndex + 1} / {slides.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1))}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              {dictionary.contentAutomation.carouselPrevious}
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current === slides.length - 1 ? 0 : current + 1))}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
            >
              {dictionary.contentAutomation.carouselNext}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {slides.map((slide, index) => (
          <button
            key={`${item.date}-${slide.postNumber}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              index === activeIndex
                ? "border-ink bg-ink text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-ink"
            }`}
          >
            {dictionary.contentAutomation.postLabel} {slide.postNumber}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeSlide.kind === "planned" ? (
          <PlannedPostCard
            dictionary={dictionary}
            agendaItem={activeSlide.agendaItem}
            postNumber={activeSlide.postNumber}
          />
        ) : activeSlide.kind === "existing" ? (
          <ExistingPostCard
            dictionary={dictionary}
            post={activeSlide.post}
            postNumber={activeSlide.postNumber}
            expectedTime={activeSlide.expectedTime}
            expectedIdea={activeSlide.expectedIdea}
            fillsExpectedSlot={activeSlide.fillsExpectedSlot}
          />
        ) : (
          <MissingPostCard
            dictionary={dictionary}
            postNumber={activeSlide.postNumber}
            expectedTime={activeSlide.expectedTime}
            expectedIdea={activeSlide.expectedIdea}
            isPastSlot={isPastSlot(item.date, activeSlide.expectedTime)}
            generationState={
              generationState?.postNumber === activeSlide.postNumber ? generationState : null
            }
          />
        )}
      </div>
    </div>
  );
}

function PlannedPostCard({
  dictionary,
  agendaItem,
  postNumber
}: {
  dictionary: AppDictionary;
  agendaItem: AgendaGroup["items"][number];
  postNumber: number;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>
              {dictionary.contentAutomation.postLabel} {postNumber}
            </span>
            <span>{agendaItem.time}</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-ink">{agendaItem.theme}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {agendaItem.type} · {agendaItem.goal}
          </p>
        </div>
        <StatusBadge
          dictionary={dictionary}
          status={agendaItem.postGenerationStatus}
          publicationState={agendaItem.linkedPublicationState}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {renderAgendaMeta(dictionary.contentAutomation.dayGoal, agendaItem.goal)}
        {renderAgendaMeta(dictionary.contentAutomation.dayTypes, agendaItem.type)}
        {renderAgendaMeta(dictionary.contentAutomation.dayFormats, agendaItem.format)}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {getStatusDescription(dictionary, agendaItem)}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {dictionary.contentAutomation.structure}
          </p>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            {agendaItem.structure.map((step, stepIndex) => (
              <p key={`${agendaItem.date}-${agendaItem.time}-${stepIndex}`}>
                {stepIndex + 1}. {step}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {dictionary.common.caption}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{agendaItem.caption}</p>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {dictionary.contentAutomation.visualIdea}
            </p>
            <p className="mt-2 text-sm text-slate-600">{agendaItem.visualIdea}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              CTA
            </p>
            <p className="mt-2 text-sm text-slate-600">{agendaItem.cta}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MissingPostCard({
  dictionary,
  postNumber,
  expectedTime,
  expectedIdea,
  isPastSlot,
  generationState
}: {
  dictionary: AppDictionary;
  postNumber: number;
  expectedTime: string;
  expectedIdea?: AgendaGroup["expectedIdeas"][number];
  isPastSlot?: boolean;
  generationState: {
    postNumber: number;
    progressPercent: number;
    remainingMs: number;
  } | null;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>
              {dictionary.contentAutomation.postLabel} {postNumber}
            </span>
            <span>{expectedTime}</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-slate-500">
            {(isPastSlot
              ? dictionary.contentAutomation.expiredSlotTitle
              : dictionary.contentAutomation.missingPostCardTitle
            ).replace("{index}", String(postNumber))}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {generationState
              ? dictionary.contentAutomation.preGeneratingCardDescription.replace(
                  "{time}",
                  formatRemainingDuration(generationState.remainingMs)
                )
              : isPastSlot
              ? dictionary.contentAutomation.expiredSlotDescription
              : dictionary.contentAutomation.missingPostCardDescription}
          </p>
        </div>
        <StatusBadge dictionary={dictionary} status="not-generated" />
      </div>

      {generationState ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <div className="h-2 overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-sky-500 transition-[width] duration-500"
              style={{ width: `${generationState.progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {renderAgendaMeta(
          dictionary.contentAutomation.dayGoal,
          expectedIdea?.goal?.trim() || dictionary.contentAutomation.noDayGoal
        )}
        {renderAgendaMeta(
          dictionary.contentAutomation.dayTypes,
          expectedIdea?.contentTypes?.trim() || dictionary.contentAutomation.notAvailableLabel
        )}
        {renderAgendaMeta(
          dictionary.contentAutomation.dayFormats,
          expectedIdea?.formats?.trim() || dictionary.contentAutomation.notAvailableLabel
        )}
      </div>
    </div>
  );
}

function ExistingPostCard({
  dictionary,
  post,
  postNumber,
  expectedTime,
  expectedIdea,
  fillsExpectedSlot
}: {
  dictionary: AppDictionary;
  post: AgendaGroup["extraPosts"][number];
  postNumber: number;
  expectedTime: string;
  expectedIdea?: AgendaGroup["expectedIdeas"][number];
  fillsExpectedSlot: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>
              {dictionary.contentAutomation.postLabel} {postNumber}
            </span>
            <span>{expectedTime || post.localTime}</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-ink">{post.topic}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {fillsExpectedSlot
              ? dictionary.contentAutomation.slotFilledByScheduledPostLabel
              : dictionary.contentAutomation.outsidePlanPostLabel}
          </p>
        </div>
        <StatusBadge
          dictionary={dictionary}
          status={post.status}
          publicationState={post.publicationState}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        {fillsExpectedSlot
          ? `${dictionary.contentAutomation.slotFilledByScheduledPostDescription} ${expectedTime}.`
          : dictionary.contentAutomation.outsidePlanPostDescription}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {renderAgendaMeta(
          dictionary.contentAutomation.dayGoal,
          fillsExpectedSlot
            ? expectedIdea?.goal?.trim() || dictionary.contentAutomation.noDayGoal
            : dictionary.contentAutomation.notAvailableLabel
        )}
        {renderAgendaMeta(
          dictionary.contentAutomation.dayTypes,
          fillsExpectedSlot
            ? expectedIdea?.contentTypes?.trim() || dictionary.contentAutomation.notAvailableLabel
            : dictionary.contentAutomation.notAvailableLabel
        )}
        {renderAgendaMeta(
          dictionary.contentAutomation.dayFormats,
          fillsExpectedSlot
            ? expectedIdea?.formats?.trim() || dictionary.contentAutomation.notAvailableLabel
            : dictionary.contentAutomation.notAvailableLabel
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {getExistingPostStatusDescription(dictionary, post, fillsExpectedSlot)}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {dictionary.common.caption}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{post.caption}</p>
      </div>
    </div>
  );
}

function StatusBadge({
  dictionary,
  status,
  publicationState
}: {
  dictionary: AppDictionary;
  status: AgendaGroup["items"][number]["postGenerationStatus"];
  publicationState?: AgendaGroup["items"][number]["linkedPublicationState"];
}) {
  return (
    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {getStatusLabel(dictionary, status, publicationState ?? null)}
    </span>
  );
}

function getStatusLabel(
  dictionary: AppDictionary,
  status: AgendaGroup["items"][number]["postGenerationStatus"],
  publicationState: AgendaGroup["items"][number]["linkedPublicationState"]
) {
  if (status === "published") {
    return `${dictionary.contentAutomation.postStatusPublished} · ${getPublicationStateLabel(
      dictionary,
      publicationState
    )}`;
  }

  if (status === "draft") {
    return dictionary.contentAutomation.postStatusDraft;
  }

  if (status === "scheduled") {
    return dictionary.contentAutomation.postStatusScheduled;
  }

  if (status === "publishing") {
    return dictionary.contentAutomation.postStatusPublishing;
  }

  if (status === "failed") {
    return dictionary.contentAutomation.postStatusFailed;
  }

  return dictionary.contentAutomation.postStatusNotGenerated;
}

function getStatusDescription(
  dictionary: AppDictionary,
  item: AgendaGroup["items"][number]
) {
  if (item.postGenerationStatus === "draft") {
    return dictionary.contentAutomation.postStatusDraftDescription;
  }

  if (item.postGenerationStatus === "scheduled") {
    return item.linkedScheduledTime
      ? `${dictionary.contentAutomation.postStatusScheduledDescription} ${formatDateTime(item.linkedScheduledTime)}.`
      : dictionary.contentAutomation.postStatusScheduledDescription;
  }

  if (item.postGenerationStatus === "publishing") {
    return dictionary.contentAutomation.postStatusPublishingDescription;
  }

  if (item.postGenerationStatus === "published") {
    return item.linkedPublishedAt
      ? `${dictionary.contentAutomation.postStatusPublishedDescription} ${formatDateTime(item.linkedPublishedAt)}.`
      : dictionary.contentAutomation.postStatusPublishedDescription;
  }

  if (item.postGenerationStatus === "failed") {
    return dictionary.contentAutomation.postStatusFailedDescription;
  }

  return dictionary.contentAutomation.postStatusNotGeneratedDescription;
}

function getExistingPostStatusDescription(
  dictionary: AppDictionary,
  post: AgendaGroup["extraPosts"][number],
  fillsExpectedSlot: boolean
) {
  if (fillsExpectedSlot) {
    if (post.status === "published") {
      return post.publishedAt
        ? `${dictionary.contentAutomation.postStatusPublishedDescription} ${formatDateTime(post.publishedAt)}.`
        : dictionary.contentAutomation.postStatusPublishedDescription;
    }

    if (post.status === "scheduled") {
      return post.scheduledTime
        ? `${dictionary.contentAutomation.postStatusScheduledDescription} ${formatDateTime(post.scheduledTime)}.`
        : dictionary.contentAutomation.postStatusScheduledDescription;
    }

    if (post.status === "draft") {
      return dictionary.contentAutomation.postStatusDraftDescription;
    }

    if (post.status === "publishing") {
      return dictionary.contentAutomation.postStatusPublishingDescription;
    }

    return dictionary.contentAutomation.postStatusFailedDescription;
  }

  if (post.status === "published") {
    return post.publishedAt
      ? `${dictionary.contentAutomation.outsidePlanPublishedDescription} ${formatDateTime(post.publishedAt)}.`
      : dictionary.contentAutomation.outsidePlanPublishedDescription;
  }

  if (post.status === "scheduled") {
    return post.scheduledTime
      ? `${dictionary.contentAutomation.outsidePlanScheduledDescription} ${formatDateTime(post.scheduledTime)}.`
      : dictionary.contentAutomation.outsidePlanScheduledDescription;
  }

  if (post.status === "draft") {
    return dictionary.contentAutomation.outsidePlanDraftDescription;
  }

  if (post.status === "publishing") {
    return dictionary.contentAutomation.postStatusPublishingDescription;
  }

  return dictionary.contentAutomation.postStatusFailedDescription;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function getPublicationStateLabel(
  dictionary: AppDictionary,
  publicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null
) {
  if (publicationState === "ARCHIVED") {
    return dictionary.contentAutomation.publicationStateArchived;
  }

  if (publicationState === "DELETED") {
    return dictionary.contentAutomation.publicationStateDeleted;
  }

  return dictionary.contentAutomation.publicationStatePublished;
}

type AgendaSlide =
  | {
      kind: "planned";
      agendaItem: AgendaGroup["items"][number];
      postNumber: number;
      expectedTime: string;
    }
  | {
      kind: "existing";
      post: AgendaGroup["extraPosts"][number];
      postNumber: number;
      expectedTime: string;
      expectedIdea?: AgendaGroup["expectedIdeas"][number];
      fillsExpectedSlot: boolean;
    }
  | {
      kind: "missing";
      postNumber: number;
      expectedTime: string;
      expectedIdea?: AgendaGroup["expectedIdeas"][number];
    };

function buildAgendaSlides(item: AgendaGroup): AgendaSlide[] {
  const totalSlots = Math.max(item.expectedPostsCount, item.items.length + item.extraPosts.length, 1);
  const slotTimes = Array.from({ length: totalSlots }, (_, index) => item.expectedTimes[index] ?? "--:--");
  const slots = Array.from({ length: totalSlots }, () => null as AgendaSlide | null);

  const sortedPlannedItems = [...item.items].sort(
    (left, right) => compareTimeStrings(left.time, right.time)
  );
  const sortedExtraPosts = [...item.extraPosts].sort(
    (left, right) => compareTimeStrings(left.localTime, right.localTime)
  );

  for (const agendaItem of sortedPlannedItems) {
    const slotIndex = findBestSlotIndex(slotTimes, slots, agendaItem.time);
    if (slotIndex === -1) {
      slots.push({
        kind: "planned",
        agendaItem,
        postNumber: slots.length + 1,
        expectedTime: agendaItem.time
      });
      continue;
    }

    slots[slotIndex] = {
      kind: "planned",
      agendaItem,
      postNumber: slotIndex + 1,
      expectedTime: slotTimes[slotIndex] ?? agendaItem.time
    };
  }

  for (const post of sortedExtraPosts) {
    const slotIndex = findBestSlotIndex(slotTimes, slots, post.localTime);
    if (slotIndex === -1) {
      slots.push({
        kind: "existing",
        post,
        postNumber: slots.length + 1,
        expectedTime: post.localTime,
        fillsExpectedSlot: false
      });
      continue;
    }

    slots[slotIndex] = {
      kind: "existing",
      post,
      postNumber: slotIndex + 1,
      expectedTime: slotTimes[slotIndex] ?? post.localTime,
      expectedIdea: item.expectedIdeas[slotIndex],
      fillsExpectedSlot: slotIndex < item.expectedPostsCount
    };
  }

  return slots.map((slide, index) => {
    if (slide) {
      return {
        ...slide,
        postNumber: index + 1
      };
    }

    return {
      kind: "missing",
      postNumber: index + 1,
      expectedTime: slotTimes[index] ?? "--:--",
      expectedIdea: item.expectedIdeas[index]
    };
  });
}

function findBestSlotIndex(
  slotTimes: string[],
  slots: Array<AgendaSlide | null>,
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
        diff: Math.abs((parseTimeToMinutes(slotTimes[entry.index]) ?? targetMinutes) - targetMinutes)
      }))
      .sort((left, right) => left.diff - right.diff || left.index - right.index)[0]?.index ?? -1
  );
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

function isPastSlot(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return false;
  }

  const [year, month, day] = date.split("-").map((value) => Number.parseInt(value, 10));
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return slotDate.getTime() < Date.now();
}

function getGenerationState(item: AgendaGroup, slides: AgendaSlide[], now: number) {
  const generatingSlide = slides.find((slide) => {
    if (slide.kind !== "missing") {
      return false;
    }

    const start = getSlotDateTimeMs(item.date, slide.expectedTime) - 5 * 60 * 1000;
    const end = getSlotDateTimeMs(item.date, slide.expectedTime);
    return Number.isFinite(start) && Number.isFinite(end) && now >= start && now < end;
  });

  if (!generatingSlide || generatingSlide.kind !== "missing") {
    return null;
  }

  const scheduledAt = getSlotDateTimeMs(item.date, generatingSlide.expectedTime);
  const startedAt = scheduledAt - 5 * 60 * 1000;
  const elapsed = Math.max(now - startedAt, 0);
  const duration = Math.max(scheduledAt - startedAt, 1);

  return {
    postNumber: generatingSlide.postNumber,
    progressPercent: Math.min((elapsed / duration) * 100, 100),
    remainingMs: Math.max(scheduledAt - now, 0)
  };
}

function getSlotDateTimeMs(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return Number.NaN;
  }

  return new Date(`${date}T${time}:00-03:00`).getTime();
}

function formatRemainingDuration(valueMs: number) {
  const totalMinutes = Math.max(Math.ceil(valueMs / 60_000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${minutes}min`;
}
