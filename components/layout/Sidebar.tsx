"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export function Sidebar() {
  const currentPath = usePathname();
  const router = useRouter();
  const { dictionary } = useI18n();
  const navigation = useMemo(
    () => [
      { href: "/dashboard", label: dictionary.sidebar.dashboard },
      { href: "/connect-instagram", label: dictionary.sidebar.connectInstagram },
      { href: "/create-post", label: dictionary.sidebar.createPost },
      { href: "/scheduled-posts", label: dictionary.sidebar.scheduledPosts },
      { href: "/content-automation", label: dictionary.sidebar.contentAutomation },
      { href: "/automation-diagnostics", label: dictionary.sidebar.automationDiagnostics }
    ],
    [dictionary]
  );

  useEffect(() => {
    for (const item of navigation) {
      if (item.href !== currentPath) {
        router.prefetch(item.href);
      }
    }
  }, [currentPath, navigation, router]);

  return (
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
            prefetch
            onMouseEnter={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
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
  );
}
