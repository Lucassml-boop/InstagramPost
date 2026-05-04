"use client";

type DiagnosticsIntroDictionary = {
  helpTitle: string;
  helpDescription: string;
  sectionRealtime: string;
  sectionRealtimeDescription: string;
  sectionSafety: string;
  sectionSafetyDescription: string;
};

function IntroCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function DiagnosticsIntroCards({
  dictionary
}: {
  dictionary: DiagnosticsIntroDictionary;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <IntroCard
        title={dictionary.helpTitle}
        description={dictionary.helpDescription}
      />
      <IntroCard
        title={dictionary.sectionRealtime}
        description={dictionary.sectionRealtimeDescription}
      />
      <IntroCard
        title={dictionary.sectionSafety}
        description={dictionary.sectionSafetyDescription}
      />
    </div>
  );
}
