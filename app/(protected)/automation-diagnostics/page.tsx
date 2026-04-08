import { AutomationDiagnostics } from "@/components/AutomationDiagnostics";
import { SectionTitle } from "@/components/ui";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function AutomationDiagnosticsPage() {
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.automationDiagnostics.eyebrow}
        title={dictionary.automationDiagnostics.title}
        description={dictionary.automationDiagnostics.description}
      />
      <div className="mt-8">
        <AutomationDiagnostics />
      </div>
    </div>
  );
}
