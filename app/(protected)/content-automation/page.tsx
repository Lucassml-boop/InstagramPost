import { ContentAutomationSettings } from "@/components/content-automation";
import { SectionTitle } from "@/components/shared";
import {
  getContentBrandProfile,
  getContentTopicsHistory,
  getCurrentWeeklyAgenda
} from "@/lib/content-system";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ContentAutomationPage() {
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);
  const [profile, agenda, topicsHistory] = await Promise.all([
    getContentBrandProfile(),
    getCurrentWeeklyAgenda(),
    getContentTopicsHistory()
  ]);

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
          initialAgenda={agenda}
          initialTopicsHistory={topicsHistory}
        />
      </div>
    </div>
  );
}
