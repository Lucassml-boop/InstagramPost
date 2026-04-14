import type { BrandProfile } from "@/lib/content-system";
import type {
  ContentPlanItemWithStatus,
  WeeklyPostSummary
} from "@/lib/content-system.agenda-status";
import type { WeeklyAgendaUsageSummary } from "@/lib/content-system.agenda-metadata";

export type DayLabel =
  | "Segunda"
  | "Terca"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sabado"
  | "Domingo";

export type Props = {
  initialProfile: BrandProfile;
  initialAgenda: ContentPlanItemWithStatus[];
  initialWeekPosts: WeeklyPostSummary[];
  initialAgendaSummary: WeeklyAgendaUsageSummary;
  initialTopicsHistory: string[];
  initialTab?: "agenda" | "settings";
  initialOutputLanguage?: "en" | "pt-BR";
  initialCustomInstructions?: string;
};

export type DaySettingsState = Record<
  DayLabel,
  {
    enabled: boolean;
    postsPerDay: string;
    postTimes: string;
    postIdeas: Array<{
      goal: string;
      contentTypes: string;
      formats: string;
    }>;
  }
>;

export type AutomationPresetsState = {
  goalPresets: string;
  contentTypePresets: string;
  formatPresets: string;
};
