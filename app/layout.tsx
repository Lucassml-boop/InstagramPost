import type { Metadata } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocaleFromCookies } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instagram AI Publisher Demo",
  description:
    "Meta App Review demo for connecting Instagram Professional accounts, generating AI posts, previewing them, and publishing through the Instagram Graph API."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <div className="mx-auto mb-4 flex max-w-7xl justify-end px-4 pt-4 sm:px-6">
            <LanguageSwitcher />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
