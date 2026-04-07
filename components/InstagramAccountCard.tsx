import Image from "next/image";
import { Panel } from "@/components/ui";

type InstagramAccountCardProps = {
  username: string;
  instagramUserId: string;
  profilePictureUrl: string | null;
  connected: boolean;
};

export function InstagramAccountCard({
  username,
  instagramUserId,
  profilePictureUrl,
  connected
}: InstagramAccountCardProps) {
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
            Connected Instagram Account
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">{username}</h2>
          <p className="text-sm text-slate-600">
            Status: {connected ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-ink">Username:</span> {username}
        </p>
        <p>
          <span className="font-semibold text-ink">Instagram ID:</span> {instagramUserId}
        </p>
        <p>
          <span className="font-semibold text-ink">Connection Status:</span>{" "}
          {connected ? "Connected" : "Not connected"}
        </p>
      </div>
    </Panel>
  );
}
