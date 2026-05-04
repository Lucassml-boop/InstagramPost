import { DAY_ORDER, DEFAULT_DISABLED_DAYS, type DayLabel } from "./content-system.constants.ts";
import type { BrandProfile, ContentPlanItem } from "./content-system.schemas.ts";
import {
  getRollingWeekDays,
  getUpcomingWeekDays,
  normalizeTimeValue,
  shiftTime
} from "./content-system.schedule-dates.ts";

type DayConfig = {
  enabled: boolean;
  postsPerDay: number;
  postTimes: string[];
  postIdeas: Array<{
    goal: string;
    contentTypes: string[];
    formats: string[];
    brandColors: string;
    confirmed: boolean;
  }>;
};

export type WeekSlot = {
  label: DayLabel;
  date: string;
  time: string;
  slotIndex: number;
  postsPerDay: number;
  goal: string;
  contentTypes: string[];
  formats: string[];
};

export function normalizeStoredAgenda(items: unknown[]) {
  return items.map((item) => {
    const candidate = (item ?? {}) as Partial<ContentPlanItem>;
    return {
      ...candidate,
      time: normalizeTimeValue(String(candidate.time ?? "")) ?? "09:00"
    };
  });
}

export function getDayConfig(profile: BrandProfile, day: DayLabel): DayConfig {
  const config = profile.weeklyAgenda[day];
  const postsPerDay = Math.min(Math.max(config?.postsPerDay ?? 1, 1), 10);
  return {
    enabled: config?.enabled ?? !DEFAULT_DISABLED_DAYS.has(day),
    postsPerDay,
    postTimes: (config?.postTimes ?? [])
      .map((value) => normalizeTimeValue(value))
      .filter(Boolean) as string[],
    postIdeas: Array.from({ length: postsPerDay }, (_, index) => {
      const savedIdea = config?.postIdeas?.[index];
      return {
        goal: savedIdea?.goal?.trim() || (index === 0 ? config?.goal?.trim() ?? "" : ""),
        contentTypes: (savedIdea?.contentTypes ?? (index === 0 ? config?.contentTypes : []) ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
        formats: (savedIdea?.formats ?? (index === 0 ? config?.formats : []) ?? [])
          .map((item) => item.trim())
          .filter(Boolean),
        brandColors: savedIdea?.brandColors?.trim() ?? "",
        confirmed: savedIdea?.confirmed ?? (
          index === 0 ||
          Boolean(savedIdea?.goal?.trim()) ||
          Boolean(savedIdea?.contentTypes?.length) ||
          Boolean(savedIdea?.formats?.length)
        )
      };
    })
  };
}

export function getConfirmedSlotIndexes(config: DayConfig) {
  return config.postIdeas
    .map((idea, index) => ({ idea, index }))
    .filter((entry) => entry.idea.confirmed)
    .map((entry) => entry.index);
}

export function countConfirmedPostsForDay(profile: BrandProfile, day: DayLabel) {
  const config = getDayConfig(profile, day);
  if (!config.enabled) {
    return 0;
  }

  return getConfirmedSlotIndexes(config).length;
}

export function countConfirmedWeeklyPosts(profile: BrandProfile) {
  return DAY_ORDER.reduce((total, day) => total + countConfirmedPostsForDay(profile, day), 0);
}

export function expandPostTimes(postTimes: string[], postsPerDay: number) {
  const times = postTimes.length > 0 ? [...postTimes] : ["09:00"];
  while (times.length < postsPerDay) {
    times.push(shiftTime(times[0], times.length * 3));
  }
  return times.slice(0, postsPerDay);
}

export function buildWeekSlots(
  profile: BrandProfile,
  referenceDate = new Date(),
  options?: {
    windowMode?: "next-week" | "rolling-7d";
  }
) {
  const slots: WeekSlot[] = [];
  const weekDays =
    options?.windowMode === "rolling-7d"
      ? getRollingWeekDays(referenceDate)
      : getUpcomingWeekDays(referenceDate);

  for (const day of weekDays) {
    const config = getDayConfig(profile, day.label);
    if (!config.enabled) {
      continue;
    }
    const expandedTimes = expandPostTimes(config.postTimes, config.postsPerDay);
    const confirmedSlotIndexes = getConfirmedSlotIndexes(config);
    const postsPerDay = Math.max(confirmedSlotIndexes.length, 1);
    for (const index of confirmedSlotIndexes) {
      const time = expandedTimes[index] ?? "09:00";
      const postIdea = config.postIdeas[index] ?? {
        goal: "",
        contentTypes: [],
        formats: [],
        confirmed: false
      };
      slots.push({
        label: day.label,
        date: day.date,
        time,
        slotIndex: index + 1,
        postsPerDay,
        goal: postIdea.goal,
        contentTypes: postIdea.contentTypes,
        formats: postIdea.formats
      });
    }
  }
  return slots;
}

export function isConfirmedDaySlot(profile: BrandProfile, day: DayLabel, time: string) {
  const config = getDayConfig(profile, day);
  const expandedTimes = expandPostTimes(config.postTimes, config.postsPerDay);
  const slotIndex = expandedTimes.findIndex((candidate) => candidate === time);

  if (slotIndex === -1) {
    return false;
  }

  return config.postIdeas[slotIndex]?.confirmed ?? false;
}

export function getDaySlotBrandColors(profile: BrandProfile, day: DayLabel, time: string) {
  const config = getDayConfig(profile, day);
  const expandedTimes = expandPostTimes(config.postTimes, config.postsPerDay);
  const slotIndex = expandedTimes.findIndex((candidate) => candidate === time);

  if (slotIndex === -1) {
    return "";
  }

  return config.postIdeas[slotIndex]?.brandColors?.trim() ?? "";
}
