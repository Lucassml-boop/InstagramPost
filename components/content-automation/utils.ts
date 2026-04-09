import type { BrandProfile } from "@/lib/content-system";
import type { DayLabel, DaySettingsState } from "./types";

export const DAY_ORDER: DayLabel[] = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"];

export function toTextareaValue(items: string[]) {
  return items.join("\n");
}

export function fromTextareaValue(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildDayState(profile: BrandProfile): DaySettingsState {
  return DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = {
        goal: profile.weeklyAgenda[day]?.goal ?? "",
        contentTypes: toTextareaValue(profile.weeklyAgenda[day]?.contentTypes ?? []),
        formats: toTextareaValue(profile.weeklyAgenda[day]?.formats ?? [])
      };
      return acc;
    },
    {} as DaySettingsState
  );
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
          goal: input.daySettings[day].goal.trim(),
          contentTypes: fromTextareaValue(input.daySettings[day].contentTypes),
          formats: fromTextareaValue(input.daySettings[day].formats)
        };
        return acc;
      },
      {} as BrandProfile["weeklyAgenda"]
    ),
    carouselDefaultStructure: fromTextareaValue(input.carouselDefaultStructure),
    contentRules: fromTextareaValue(input.contentRules),
    researchQueries: fromTextareaValue(input.researchQueries)
  };
}
