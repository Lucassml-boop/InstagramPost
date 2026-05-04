import type { AutomaticPostIdea, BrandProfile } from "@/lib/content-system";
import type { WeeklyAgendaUsageSummary } from "@/lib/content-system.agenda-metadata";
import type {
  ContentPlanItemWithStatus,
  WeeklyPostSummary
} from "@/lib/content-system.agenda-status";

export type BrandProfileResponse = {
  profile?: BrandProfile;
  error?: string;
};

export type BrandProfileWithAgendaResponse = BrandProfileResponse & {
  agenda?: ContentPlanItemWithStatus[];
  weekPosts?: WeeklyPostSummary[];
  agendaSummary?: WeeklyAgendaUsageSummary;
  prepared?: number;
  scanned?: number;
};

export type GenerateWeeklyAgendaResponse = {
  agenda?: ContentPlanItemWithStatus[];
  weekPosts?: WeeklyPostSummary[];
  agendaSummary?: WeeklyAgendaUsageSummary;
  currentTopics?: string[];
  prepared?: number;
  scanned?: number;
  error?: string;
};

export type GenerationProgressResponse = {
  progress?: {
    state: "idle" | "running" | "completed" | "failed";
    stage:
      | "saving-settings"
      | "generating-weekly-plan"
      | "materializing-posts"
      | "summarizing-response"
      | "completed"
      | "failed"
      | null;
    startedAt: number | null;
    updatedAt: number | null;
    completedAt: number | null;
    message: string | null;
    prepared: number;
    scanned: number;
    activeTheme: string | null;
    currentPostIndex: number | null;
    totalPosts: number | null;
    errorMessage: string | null;
  };
  error?: string;
};

export type AutomaticPostIdeaInput = {
  profile: BrandProfile;
  day: string;
  postIndex: number;
};

export type AutomaticSettingInput = {
  profile: BrandProfile;
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
};

export type AutomaticSettingsBundleResponse = {
  brandName?: string;
  editableBrief?: string;
  services?: string;
  contentRules?: string;
  researchQueries?: string;
  carouselDefaultStructure?: string;
  goalPresets?: string;
  contentTypePresets?: string;
  formatPresets?: string;
  customInstructions?: string;
  error?: string;
};
