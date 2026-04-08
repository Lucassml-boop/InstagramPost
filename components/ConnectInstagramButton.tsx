"use client";

import { useI18n } from "@/components/I18nProvider";

export function ConnectInstagramButton() {
  const { dictionary } = useI18n();

  return (
    <a
      href="/api/auth/instagram"
      className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      {dictionary.connectInstagram.button}
    </a>
  );
}
