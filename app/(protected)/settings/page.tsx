import { ContentAutomationSettings } from "@/components/content-automation";
import { SectionTitle } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";
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
  const [profile, agenda, topicsHistory] = await Promise.all([
    getContentBrandProfile(),
    getCurrentWeeklyAgenda(),
    getContentTopicsHistory()
  ]);

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
          initialAgenda={agenda}
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
