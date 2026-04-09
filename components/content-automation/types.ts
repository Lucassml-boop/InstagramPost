import type { BrandProfile, ContentPlanItem } from "@/lib/content-system";

export type DayLabel = "Segunda" | "Terca" | "Quarta" | "Quinta" | "Sexta";

export type Props = {
  initialProfile: BrandProfile;
  initialAgenda: ContentPlanItem[];
  initialTopicsHistory: string[];
};

export type DaySettingsState = Record<
  DayLabel,
  {
    goal: string;
    contentTypes: string;
    formats: string;
  }
>;
