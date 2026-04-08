"use client";

import { useI18n } from "@/components/I18nProvider";

export function PostScheduler({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { dictionary } = useI18n();

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">
        {dictionary.scheduler.label}
        <input
          type="datetime-local"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
        />
      </label>
    </div>
  );
}
