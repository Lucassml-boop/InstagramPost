import { DAY_ORDER, DEFAULT_DISABLED_DAYS, type DayLabel } from "./content-system.constants.ts";
import type { BrandProfile, ContentPlanItem } from "./content-system.schemas.ts";

type DayConfig = {
  enabled: boolean;
  postsPerDay: number;
  postTimes: string[];
  postIdeas: Array<{
    goal: string;
    contentTypes: string[];
    formats: string[];
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

export function normalizeTimeValue(value: string) {
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

export function normalizeStoredAgenda(items: unknown[]) {
  return items.map((item) => {
    const candidate = (item ?? {}) as Partial<ContentPlanItem>;
    return {
      ...candidate,
      time: normalizeTimeValue(String(candidate.time ?? "")) ?? "09:00"
    };
  });
}

function shiftTime(base: string, offsetHours: number) {
  const [hours, minutes] = base.split(":").map((value) => Number.parseInt(value, 10));
  const totalMinutes =
    ((hours * 60 + minutes + offsetHours * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60
  ).padStart(2, "0")}`;
}

function getUpcomingWeekDays(referenceDate = new Date()) {
  const local = new Date(referenceDate);
  const daysUntilNextMonday = ((8 - local.getDay()) % 7) || 7;
  const monday = new Date(local);
  monday.setDate(local.getDate() + daysUntilNextMonday);
  monday.setHours(0, 0, 0, 0);
  return DAY_ORDER.map((label, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return { label, date: current.toISOString().slice(0, 10) };
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
          .filter(Boolean)
      };
    })
  };
}

export function expandPostTimes(postTimes: string[], postsPerDay: number) {
  const times = postTimes.length > 0 ? [...postTimes] : ["09:00"];
  while (times.length < postsPerDay) {
    times.push(shiftTime(times[0], times.length * 3));
  }
  return times.slice(0, postsPerDay);
}

export function buildWeekSlots(profile: BrandProfile, referenceDate = new Date()) {
  const slots: WeekSlot[] = [];
  for (const day of getUpcomingWeekDays(referenceDate)) {
    const config = getDayConfig(profile, day.label);
    if (!config.enabled) {
      continue;
    }
    for (const [index, time] of expandPostTimes(config.postTimes, config.postsPerDay).entries()) {
      const postIdea = config.postIdeas[index] ?? { goal: "", contentTypes: [], formats: [] };
      slots.push({
        label: day.label,
        date: day.date,
        time,
        slotIndex: index + 1,
        postsPerDay: config.postsPerDay,
        goal: postIdea.goal,
        contentTypes: postIdea.contentTypes,
        formats: postIdea.formats
      });
    }
  }
  return slots;
}
