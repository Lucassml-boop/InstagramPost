"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, dictionary } = useI18n();

  function handleChange(nextLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(nextLocale)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <span>{dictionary.language.label}</span>
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value as Locale)}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
      >
        <option value="en">{dictionary.language.en}</option>
        <option value="pt-BR">{dictionary.language.ptBR}</option>
      </select>
    </label>
  );
}
