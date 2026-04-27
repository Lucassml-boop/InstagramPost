import { ContentAutomationSettings } from "@/components/content-automation";
import { SectionTitle } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";
import {
  getWeeklyAgendaState,
  serializeWeeklyAgendaState,
  summarizeWeeklyAgendaUsage
} from "@/lib/content-system.agenda-metadata";
import {
  attachAgendaPostStatuses,
  getWeeklyPostsForAgenda
} from "@/lib/content-system.agenda-status";
import {
  getContentBrandProfile,
  getContentTopicsHistory,
  getCurrentWeeklyAgenda
} from "@/lib/content-system";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function SettingsPage() {
  const locale = await getLocaleFromCookies();
  const user = await getCurrentUser();
  const dictionary = getDictionary(locale);
  const userId = user?.id;
  const [profile, agenda, topicsHistory] = await Promise.all([
    getContentBrandProfile(userId),
    getCurrentWeeklyAgenda(userId),
    getContentTopicsHistory(userId)
  ]);
  const agendaWithStatus = user ? await attachAgendaPostStatuses(user.id, agenda) : [];
  const weekPosts = user ? await getWeeklyPostsForAgenda(user.id, agenda) : [];
  const totalExpectedPosts = Object.values(profile.weeklyAgenda).reduce(
    (total, day) => total + ((day?.enabled ?? false) ? Math.max(1, day?.postsPerDay ?? 1) : 0),
    0
  );
  const agendaMetadata = user ? serializeWeeklyAgendaState(await getWeeklyAgendaState(user.id)) : null;
  const initialAgendaSummary = summarizeWeeklyAgendaUsage({
    agenda: agendaWithStatus,
    totalExpectedPosts,
    metadata: agendaMetadata
  });

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.contentAutomation.eyebrow}
        title={dictionary.contentAutomation.settingsTab}
        description={dictionary.contentAutomation.description}
      />
      <div className="mt-8">
        <ContentAutomationSettings
          initialProfile={profile}
          initialAgenda={agendaWithStatus}
          initialWeekPosts={weekPosts}
          initialAgendaSummary={initialAgendaSummary}
          initialTopicsHistory={topicsHistory}
          initialTab="settings"
          initialOutputLanguage={user?.preferredOutputLanguage === "pt-BR" ? "pt-BR" : "en"}
          initialCustomInstructions={
            user?.preferredCustomInstructions?.trim() ||
            "You are an expert Instagram content strategist and visual designer."
          }
        />
      </div>
    </div>
  );
}
