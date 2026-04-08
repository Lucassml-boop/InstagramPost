import { ConnectInstagramButton } from "@/components/ConnectInstagramButton";
import { Panel, SectionTitle } from "@/components/ui";
import { getDictionary } from "@/lib/i18n";
import { getLocaleFromCookies } from "@/lib/i18n-server";

export default async function ConnectInstagramPage() {
  const locale = await getLocaleFromCookies();
  const dictionary = getDictionary(locale);

  return (
    <div>
      <SectionTitle
        eyebrow={dictionary.connectInstagram.eyebrow}
        title={dictionary.connectInstagram.title}
        description={dictionary.connectInstagram.description}
      />

      <Panel className="mt-8 max-w-2xl p-8">
        <p className="text-sm leading-7 text-slate-600">{dictionary.connectInstagram.body}</p>
        <div className="mt-8">
          <ConnectInstagramButton />
        </div>
      </Panel>
    </div>
  );
}
