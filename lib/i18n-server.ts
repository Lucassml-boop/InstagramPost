import { cookies } from "next/headers";
import { isLocale, type Locale, LOCALE_COOKIE_NAME } from "@/lib/i18n";

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return cookieValue && isLocale(cookieValue) ? cookieValue : "en";
}
