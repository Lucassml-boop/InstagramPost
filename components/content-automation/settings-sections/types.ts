import type { ReactNode } from "react";
import type { useI18n } from "@/components/I18nProvider";
import type { BriefingFieldId, BriefingMode } from "@/lib/briefing-builder";
import type { DayLabel } from "@/components/content-automation/types";
import type { WeeklyAgendaUsageSummary } from "@/lib/content-system.agenda-metadata";
import type {
  AgendaPostGenerationStatus,
  WeeklyPostSummary
} from "@/lib/content-system.agenda-status";

export type AppDictionary = ReturnType<typeof useI18n>["dictionary"];

export type AutoButtonRenderer = (
  key: string,
  onClick: () => Promise<void> | void
) => ReactNode;

export type PresetPickerRenderer = (input: {
  pickerKey: string;
  presetsList: string[];
  value: string;
  onAuto: () => Promise<void> | void;
  onSelectPreset: (preset: string) => void;
  multiselect?: boolean;
}) => ReactNode;

export type BriefingFieldDefinition = [BriefingFieldId, string];

export type AgendaGroup = {
  day: string;
  date: string;
  time: string;
  goal: string;
  type: string;
  format: string;
  theme: string;
  structure: string[];
  caption: string;
  visualIdea: string;
  cta: string;
  postGenerationStatus: AgendaPostGenerationStatus;
  linkedPostId: string | null;
  linkedScheduledTime: string | null;
  linkedPublishedAt: string | null;
  linkedPublicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null;
  expectedPostsCount: number;
  expectedTimes: string[];
  expectedIdeas: Array<{
    goal: string;
    contentTypes: string;
    formats: string;
  }>;
  items: Array<{
    date: string;
    day: string;
    time: string;
    goal: string;
    type: string;
    format: string;
    theme: string;
    structure: string[];
    caption: string;
    visualIdea: string;
    cta: string;
    postGenerationStatus: AgendaPostGenerationStatus;
    linkedPostId: string | null;
    linkedScheduledTime: string | null;
    linkedPublishedAt: string | null;
    linkedPublicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null;
  }>;
  extraPosts: WeeklyPostSummary[];
};

export type BriefingSettingsSectionProps = {
  dictionary: AppDictionary;
  outputLanguage: "en" | "pt-BR";
  setOutputLanguage: (value: "en" | "pt-BR") => void;
  briefingMode: BriefingMode;
  setBriefingMode: (value: BriefingMode) => void;
  briefingFieldDefinitions: BriefingFieldDefinition[];
  guidedBriefingFields: Record<BriefingFieldId, string>;
  updateGuidedBriefingField: (field: BriefingFieldId, value: string) => void;
  guidedBriefingPrompt: string;
  customInstructions: string;
  setCustomInstructions: (value: string) => void;
  renderAutoButton: AutoButtonRenderer;
  generatePromptInstructions: () => Promise<void> | void;
  clearGuidedBriefing: () => void;
  generateAutomaticSettingsBundle: () => void;
  isAutoGeneratingAllSettings: boolean;
  saveGenerationSettings: () => void;
  isSavingGenerationSettings: boolean;
  generationSettingsMessage: string | null;
};

export type SettingsSectionsProps = {
  dictionary: AppDictionary;
  brandName: string;
  setBrandName: (value: string) => void;
  editableBrief: string;
  setEditableBrief: (value: string) => void;
  automationLoopEnabled: boolean;
  setAutomationLoopEnabled: (value: boolean) => void;
  topicsHistoryCleanupFrequency: "disabled" | "daily" | "weekly" | "monthly";
  setTopicsHistoryCleanupFrequency: (value: "disabled" | "daily" | "weekly" | "monthly") => void;
  services: string;
  setServices: (value: string) => void;
  contentRules: string;
  setContentRules: (value: string) => void;
  researchQueries: string;
  setResearchQueries: (value: string) => void;
  carouselDefaultStructure: string;
  setCarouselDefaultStructure: (value: string) => void;
  presets: {
    goalPresets: string;
    contentTypePresets: string;
    formatPresets: string;
  };
  updatePreset: (key: "goalPresets" | "contentTypePresets" | "formatPresets", value: string) => void;
  renderAutoButton: AutoButtonRenderer;
  runAutomaticSetting: (input: {
    key: string;
    target:
      | "brandName"
      | "editableBrief"
      | "services"
      | "contentRules"
      | "researchQueries"
      | "carouselDefaultStructure"
      | "goalPresets"
      | "contentTypePresets"
      | "formatPresets"
      | "customInstructions";
    currentValue: string;
    apply: (value: string) => void;
  }) => Promise<void>;
  saveSettings: () => void;
  generateWeeklyAgenda: () => void;
  isSaving: boolean;
  isGenerating: boolean;
  currentTopics: string[];
  uniqueTopicsHistory: string[];
  clearTopicsHistory: () => void;
};

export type AgendaSectionsProps = {
  dictionary: AppDictionary;
  daySettings: Record<DayLabel, {
    enabled: boolean;
    postsPerDay: string;
    postTimes: string;
    postIdeas: Array<{ goal: string; contentTypes: string; formats: string; confirmed: boolean }>;
  }>;
  expandedDays: Record<DayLabel, boolean>;
  toggleExpandedDay: (day: DayLabel) => void;
  toggleDay: (day: DayLabel, enabled: boolean) => void;
  updateDay: (day: DayLabel, field: "postsPerDay" | "postTimes", value: string) => void;
  updateDayPostTime: (day: DayLabel, index: number, value: string) => void;
  updateDayPostIdea: (
    day: DayLabel,
    index: number,
    field: "goal" | "contentTypes" | "formats",
    value: string
  ) => void;
  toggleDayPostConfirmation: (day: DayLabel, index: number, confirmed: boolean) => void;
  renderPresetPicker: PresetPickerRenderer;
  goalPresetItems: string[];
  contentTypePresetItems: string[];
  formatPresetItems: string[];
  autoFillKey: string | null;
  generateAutomaticPostIdea: (day: DayLabel, index: number) => Promise<void>;
  autoFillNewDayPost: (day: DayLabel, index: number) => Promise<void>;
  dismissAutoFillSuggestion: (day: DayLabel, index: number) => void;
  suggestedAutoFillTargets: Record<DayLabel, number[]>;
  postTimesByDay: Record<DayLabel, string[]>;
  setAllDaysEnabled: (enabled: boolean) => void;
  saveSettings: () => void;
  generateWeeklyAgenda: () => void;
  isSaving: boolean;
  isGenerating: boolean;
  currentTopics: string[];
  groupedAgenda: AgendaGroup[];
  totalExpectedPosts: number;
  agendaSummary: WeeklyAgendaUsageSummary;
  keepUsingStaleAgenda: () => void;
  isResolvingStaleAgenda: boolean;
};
