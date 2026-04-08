"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useI18n } from "@/components/I18nProvider";

export function Sidebar() {
  const currentPath = usePathname();
  const { dictionary } = useI18n();
  const navigation = [
    { href: "/dashboard", label: dictionary.sidebar.dashboard },
    { href: "/connect-instagram", label: dictionary.sidebar.connectInstagram },
    { href: "/create-post", label: dictionary.sidebar.createPost },
    { href: "/scheduled-posts", label: dictionary.sidebar.scheduledPosts }
  ];

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
