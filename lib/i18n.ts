import { enDictionary, type Dictionary } from "./i18n.en.ts";
import { ptBRDictionary } from "./i18n.pt-BR.ts";

export const LOCALE_COOKIE_NAME = "site_locale";
export const locales = ["en", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Dictionary> = {
  en: enDictionary,
  "pt-BR": ptBRDictionary
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
