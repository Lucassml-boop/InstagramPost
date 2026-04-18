export function MetricCard({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-4 ${
        accent ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-ink"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
          accent ? "text-white/70" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
