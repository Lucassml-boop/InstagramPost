import type { ScheduledPostsDictionary } from "./types";

export function ScheduledPostsSummaryCards({
  counts,
  dictionary
}: {
  counts: { drafts: number; scheduled: number; published: number };
  dictionary: ScheduledPostsDictionary;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard label={dictionary.draftCount} value={counts.drafts} />
      <SummaryCard label={dictionary.scheduledCount} value={counts.scheduled} />
      <SummaryCard label={dictionary.publishedCount} value={counts.published} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
