import type { WeeklyAgendaUsageSummary } from "@/lib/content-system.agenda-metadata";
import type {
  AgendaPostGenerationStatus,
  WeeklyPostSummary
} from "@/lib/content-system.agenda-status";

export type AgendaGenerationStatus = {
  state: "idle" | "running" | "completed" | "failed";
  phase: "saving-settings" | "generating-plan" | "refreshing-data" | null;
  startedAt: number | null;
  phaseStartedAt: number | null;
  completedAt: number | null;
  detailMessage: string | null;
  preparedCount: number | null;
  scannedCount: number | null;
  activeTheme: string | null;
  currentPostIndex: number | null;
  totalPosts: number | null;
  errorMessage: string | null;
};

export type AgendaItem = {
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
  linkedPostCaption?: string | null;
  linkedPostImageUrl?: string | null;
  linkedPostPreviewUrl?: string | null;
  linkedPostBrandColors?: string | null;
  linkedPostType?: "FEED" | "STORY" | "CAROUSEL" | null;
};

export type AgendaGroup = AgendaItem & {
  expectedPostsCount: number;
  expectedTimes: string[];
  expectedIdeas: Array<{
    goal: string;
    contentTypes: string;
    formats: string;
    brandColors: string;
  }>;
  items: AgendaItem[];
  extraPosts: WeeklyPostSummary[];
};

export type AgendaSummary = WeeklyAgendaUsageSummary;
