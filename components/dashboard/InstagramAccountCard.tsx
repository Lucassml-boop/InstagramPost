import Image from "next/image";
import { Panel } from "@/components/shared";
import { getDictionary, type Locale } from "@/lib/i18n";

type InstagramAccountCardProps = {
  username: string;
  instagramUserId: string;
  profilePictureUrl: string | null;
  connected: boolean;
  locale: Locale;
};

export function InstagramAccountCard({
  username,
  instagramUserId,
  profilePictureUrl,
  connected,
  locale
}: InstagramAccountCardProps) {
  const dictionary = getDictionary(locale);

  return (
    <Panel className="p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brandDark">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt={username}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {dictionary.instagramCard.title}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">{username}</h2>
          <p className="text-sm text-slate-600">
            {dictionary.common.status}:{" "}
            {connected ? dictionary.common.connected : dictionary.common.notConnected}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-ink">{dictionary.instagramCard.username}:</span>{" "}
          {username}
        </p>
        <p>
          <span className="font-semibold text-ink">{dictionary.instagramCard.instagramId}:</span>{" "}
          {instagramUserId}
        </p>
        <p>
          <span className="font-semibold text-ink">{dictionary.instagramCard.connectionStatus}:</span>{" "}
          {connected ? dictionary.common.connected : dictionary.common.notConnected}
        </p>
      </div>
    </Panel>
  );
}
