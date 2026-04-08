"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  dictionary: ReturnType<typeof getDictionary>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = {
    locale,
    dictionary: getDictionary(locale)
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}
