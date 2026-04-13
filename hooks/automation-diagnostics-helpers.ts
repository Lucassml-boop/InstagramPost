import type { ContentPlanItem } from "@/lib/content-system";

export type AutomationAction = {
  id:
    | "generate-weekly"
    | "clear-topics-history"
    | "publish-scheduled"
    | "publish-weekly-preview"
    | "refresh-instagram";
  title: string;
  description: string;
  endpoint: string;
  method: "GET" | "POST";
};

export type ActionState = {
  loading: boolean;
  status: number | null;
  result: string | null;
  parsed: unknown | null;
  error: string | null;
};

type DiagnosticsDictionary = {
  generateWeeklyTitle: string;
  generateWeeklyDescription: string;
  clearTopicsTitle: string;
  clearTopicsDescription: string;
  publishScheduledTitle: string;
  publishScheduledDescription: string;
  publishWeeklyPreviewTitle: string;
  publishWeeklyPreviewDescription: string;
  refreshTokensTitle: string;
  refreshTokensDescription: string;
  summaryLabel: string;
  weeklySkipped: string;
  itemsGenerated: string;
  cleanupSkipped: string;
  itemsCleared: string;
  itemsProcessed: string;
  itemsPublished: string;
  itemsFailed: string;
  tokensRefreshed: string;
};

export function buildAutomationActions(dictionary: DiagnosticsDictionary): AutomationAction[] {
  return [
    {
      id: "generate-weekly",
      title: dictionary.generateWeeklyTitle,
      description: dictionary.generateWeeklyDescription,
      endpoint: "/api/cron/generate-weekly-content",
      method: "GET"
    },
    {
      id: "clear-topics-history",
      title: dictionary.clearTopicsTitle,
      description: dictionary.clearTopicsDescription,
      endpoint: "/api/cron/clear-topics-history",
      method: "GET"
    },
    {
      id: "publish-scheduled",
      title: dictionary.publishScheduledTitle,
      description: dictionary.publishScheduledDescription,
      endpoint: "/api/cron/publish-scheduled",
      method: "POST"
    },
    {
      id: "publish-weekly-preview",
      title: dictionary.publishWeeklyPreviewTitle,
      description: dictionary.publishWeeklyPreviewDescription,
      endpoint: "/api/content-system/publish-weekly-preview",
      method: "POST"
    },
    {
      id: "refresh-instagram",
      title: dictionary.refreshTokensTitle,
      description: dictionary.refreshTokensDescription,
      endpoint: "/api/cron/refresh-instagram-tokens",
      method: "POST"
    }
  ];
}

export function getHumanSummary(
  dictionary: DiagnosticsDictionary,
  actionId: AutomationAction["id"],
  parsed: unknown
) {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;

  if (actionId === "generate-weekly") {
    if (candidate.skipped === true) {
      return `${dictionary.summaryLabel} ${dictionary.weeklySkipped}`;
    }

    if (typeof candidate.generated === "number") {
      return `${dictionary.summaryLabel} ${candidate.generated} ${dictionary.itemsGenerated}`;
    }
  }

  if (actionId === "clear-topics-history") {
    if (candidate.skipped === true && typeof candidate.frequency === "string") {
      return `${dictionary.summaryLabel} ${dictionary.cleanupSkipped} (${candidate.frequency})`;
    }

    if (typeof candidate.clearedEntries === "number") {
      return `${dictionary.summaryLabel} ${candidate.clearedEntries} ${dictionary.itemsCleared}`;
    }
  }

  if (actionId === "publish-scheduled" && typeof candidate.processed === "number") {
    return `${dictionary.summaryLabel} ${candidate.processed} ${dictionary.itemsProcessed}`;
  }

  if (actionId === "publish-weekly-preview") {
    const published = typeof candidate.published === "number" ? candidate.published : 0;
    const failed = typeof candidate.failed === "number" ? candidate.failed : 0;
    return `${dictionary.summaryLabel} ${published} ${dictionary.itemsPublished}, ${failed} ${dictionary.itemsFailed}`;
  }

  if (actionId === "refresh-instagram" && typeof candidate.refreshed === "number") {
    return `${dictionary.summaryLabel} ${candidate.refreshed} ${dictionary.tokensRefreshed}`;
  }

  return null;
}

export async function loadAgendaOptions(
  agendaOptions: ContentPlanItem[],
  fetchAgenda: () => Promise<{ agenda?: ContentPlanItem[] }>,
  setAgendaOptions: (agenda: ContentPlanItem[]) => void
) {
  if (agendaOptions.length > 0) {
    return agendaOptions;
  }

  const json = await fetchAgenda();
  const nextAgenda = json.agenda ?? [];
  setAgendaOptions(nextAgenda);
  return nextAgenda;
}
