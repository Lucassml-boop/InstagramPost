import { clsx } from "clsx";
import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-mist px-4 py-6 sm:px-6">{children}</main>;
}

export function Panel({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={clsx("panel", className)}>{children}</div>;
}

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}
