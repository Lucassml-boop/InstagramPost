"use client";

export function GeneratorTabs({
  activeTab,
  onChange,
  contentLabel,
  settingsLabel
}: {
  activeTab: "content" | "settings";
  onChange: (value: "content" | "settings") => void;
  contentLabel: string;
  settingsLabel: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-3xl bg-slate-100 p-2">
      <button
        type="button"
        onClick={() => onChange("content")}
        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
          activeTab === "content"
            ? "bg-white text-ink shadow-sm"
            : "text-slate-600 hover:text-ink"
        }`}
      >
        {contentLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("settings")}
        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
          activeTab === "settings"
            ? "bg-white text-ink shadow-sm"
            : "text-slate-600 hover:text-ink"
        }`}
      >
        {settingsLabel}
      </button>
    </div>
  );
}
