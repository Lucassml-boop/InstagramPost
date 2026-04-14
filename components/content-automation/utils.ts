import type { BrandProfile } from "@/lib/content-system";
import type { AutomationPresetsState, DayLabel, DaySettingsState } from "./types";

export const DAY_ORDER: DayLabel[] = [
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
  "Domingo"
];

export function toTextareaValue(items: string[]) {
  return items.join("\n");
}

export function fromTextareaValue(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function expandPreviewPostTimes(postTimes: string[], postsPerDay: number) {
  const times = postTimes.length > 0 ? [...postTimes] : ["09:00"];

  while (times.length < postsPerDay) {
    const [hours, minutes] = (times[0] ?? "09:00").split(":").map((item) => Number.parseInt(item, 10));
    const totalMinutes =
      ((hours * 60 + minutes + times.length * 180) % (24 * 60) + 24 * 60) % (24 * 60);
    times.push(
      `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`
    );
  }

  return times.slice(0, postsPerDay);
}

function buildPostIdeas(profile: BrandProfile, day: DayLabel) {
  const config = profile.weeklyAgenda[day];
  const postsPerDay = Math.max(1, config?.postsPerDay ?? 1);
  const savedIdeas = config?.postIdeas ?? [];

  return Array.from({ length: postsPerDay }, (_, index) => {
    const saved = savedIdeas[index];
    const fallbackGoal = index === 0 ? config?.goal ?? "" : "";
    const fallbackTypes = index === 0 ? config?.contentTypes ?? [] : [];
    const fallbackFormats = index === 0 ? config?.formats ?? [] : [];

    return {
      goal: saved?.goal ?? fallbackGoal,
      contentTypes: toTextareaValue(saved?.contentTypes ?? fallbackTypes),
      formats: toTextareaValue(saved?.formats ?? fallbackFormats)
    };
  });
}

export function buildDayState(profile: BrandProfile): DaySettingsState {
  return DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = {
        enabled:
          profile.weeklyAgenda[day]?.enabled ?? (day !== "Sabado" && day !== "Domingo"),
        postsPerDay: String(profile.weeklyAgenda[day]?.postsPerDay ?? 1),
        postTimes: toTextareaValue(profile.weeklyAgenda[day]?.postTimes ?? ["09:00"]),
        postIdeas: buildPostIdeas(profile, day)
      };
      return acc;
    },
    {} as DaySettingsState
  );
}

export function buildPresetsState(profile: BrandProfile): AutomationPresetsState {
  return {
    goalPresets: toTextareaValue(profile.goalPresets ?? []),
    contentTypePresets: toTextareaValue(profile.contentTypePresets ?? []),
    formatPresets: toTextareaValue(profile.formatPresets ?? [])
  };
}

export function buildProfileFromState(input: {
  brandName: string;
  editableBrief: string;
  automationLoopEnabled: boolean;
  topicsHistoryCleanupFrequency: "disabled" | "daily" | "weekly" | "monthly";
  services: string;
  carouselDefaultStructure: string;
  contentRules: string;
  researchQueries: string;
  daySettings: DaySettingsState;
  presets: AutomationPresetsState;
}): BrandProfile {
  return {
    brandName: input.brandName.trim(),
    editableBrief: input.editableBrief.trim(),
    automationLoopEnabled: input.automationLoopEnabled,
    topicsHistoryCleanupFrequency: input.topicsHistoryCleanupFrequency,
    services: fromTextareaValue(input.services),
    weeklyAgenda: DAY_ORDER.reduce(
      (acc, day) => {
        acc[day] = {
          enabled: input.daySettings[day].enabled,
          postsPerDay: Math.max(1, Number.parseInt(input.daySettings[day].postsPerDay, 10) || 1),
          postTimes: fromTextareaValue(input.daySettings[day].postTimes),
          goal: input.daySettings[day].postIdeas[0]?.goal.trim() ?? "",
          contentTypes: fromTextareaValue(input.daySettings[day].postIdeas[0]?.contentTypes ?? ""),
          formats: fromTextareaValue(input.daySettings[day].postIdeas[0]?.formats ?? ""),
          postIdeas: input.daySettings[day].postIdeas.map((idea) => ({
            goal: idea.goal.trim(),
            contentTypes: fromTextareaValue(idea.contentTypes),
            formats: fromTextareaValue(idea.formats)
          }))
        };
        return acc;
      },
      {} as BrandProfile["weeklyAgenda"]
    ),
    carouselDefaultStructure: fromTextareaValue(input.carouselDefaultStructure),
    contentRules: fromTextareaValue(input.contentRules),
    researchQueries: fromTextareaValue(input.researchQueries),
    goalPresets: fromTextareaValue(input.presets.goalPresets),
    contentTypePresets: fromTextareaValue(input.presets.contentTypePresets),
    formatPresets: fromTextareaValue(input.presets.formatPresets)
  };
}
