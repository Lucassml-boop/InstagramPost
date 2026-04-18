"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export function Sidebar() {
  const currentPath = usePathname();
  const { dictionary } = useI18n();
  const isAiAdsMode = currentPath.startsWith("/ai-ads");
  const postNavigation = [
    { href: "/dashboard", label: dictionary.sidebar.dashboard },
    { href: "/connect-instagram", label: dictionary.sidebar.connectInstagram },
    { href: "/create-post", label: dictionary.sidebar.createPost },
    { href: "/scheduled-posts", label: dictionary.sidebar.scheduledPosts },
    { href: "/content-automation", label: dictionary.sidebar.contentAutomation },
    { href: "/automation-diagnostics", label: dictionary.sidebar.automationDiagnostics }
  ];
  const aiAdsNavigation = [{ href: "/ai-ads", label: "AI Ads" }];
  const navigation = isAiAdsMode ? aiAdsNavigation : postNavigation;

  return (
    <div className="space-y-3">
      <div className="panel p-2">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {dictionary.sidebar.switchLabel}
        </p>
        <div className="relative grid grid-cols-2 rounded-full bg-slate-100 p-1">
          <div
            className={clsx(
              "pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-ink shadow-sm transition-transform duration-200",
              isAiAdsMode ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
            )}
          />
          <Link
            href="/dashboard"
            className={clsx(
              "relative z-10 block rounded-full px-4 py-3 text-center text-sm font-semibold transition",
              !isAiAdsMode
                ? "text-white"
                : "text-slate-600 hover:text-ink"
            )}
          >
            {dictionary.sidebar.postSystem}
          </Link>
          <Link
            href="/ai-ads"
            className={clsx(
              "relative z-10 block rounded-full px-4 py-3 text-center text-sm font-semibold transition",
              isAiAdsMode
                ? "text-white"
                : "text-slate-600 hover:text-ink"
            )}
          >
            {dictionary.sidebar.aiAdsSystem}
          </Link>
        </div>
      </div>

      <aside className="panel h-fit p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {dictionary.common.appName}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{dictionary.common.reviewDemo}</h2>
        </div>

        <nav className="mt-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block rounded-2xl px-4 py-3 text-sm font-medium transition",
                currentPath === item.href
                  ? "bg-ink text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
