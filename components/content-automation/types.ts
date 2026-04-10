import type { BrandProfile, ContentPlanItem } from "@/lib/content-system";

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
  initialAgenda: ContentPlanItem[];
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
