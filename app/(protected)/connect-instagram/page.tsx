import { ConnectInstagramButton } from "@/components/ConnectInstagramButton";
import { Panel, SectionTitle } from "@/components/ui";

export default function ConnectInstagramPage() {
  return (
    <div>
      <SectionTitle
        eyebrow="Instagram OAuth"
        title="Connect Instagram Account"
        description="Authorize a professional Instagram account with instagram_business_basic and instagram_business_content_publish so the app can fetch profile data, render assets, and publish posts."
      />

      <Panel className="mt-8 max-w-2xl p-8">
        <p className="text-sm leading-7 text-slate-600">
          When you click the button below, the app redirects to Instagram OAuth. After
          approval, the callback exchanges the code for an access token, fetches the
          profile, stores it securely on the server, and returns you to the dashboard.
        </p>
        <div className="mt-8">
          <ConnectInstagramButton />
        </div>
      </Panel>
    </div>
  );
}
