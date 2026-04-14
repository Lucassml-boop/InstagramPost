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
import { countConfirmedWeeklyPosts } from "@/lib/content-system.schedule";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ContentAutomationPage() {
  const user = await getCurrentUser();
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);
  const [profile, agenda, topicsHistory] = await Promise.all([
    getContentBrandProfile(),
    getCurrentWeeklyAgenda(),
    getContentTopicsHistory()
  ]);
  const agendaWithStatus = user ? await attachAgendaPostStatuses(user.id, agenda) : [];
  const weekPosts = user ? await getWeeklyPostsForAgenda(user.id, agenda) : [];
  const totalExpectedPosts = countConfirmedWeeklyPosts(profile);
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
        title={dictionary.contentAutomation.title}
        description={dictionary.contentAutomation.description}
      />
      <div className="mt-8">
        <ContentAutomationSettings
          initialProfile={profile}
          initialAgenda={agendaWithStatus}
          initialWeekPosts={weekPosts}
          initialAgendaSummary={initialAgendaSummary}
          initialTopicsHistory={topicsHistory}
          initialTab="agenda"
        />
      </div>
    </div>
  );
}
