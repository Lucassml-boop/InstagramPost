import { Panel } from "@/components/shared";
import { renderAgendaMeta } from "@/components/content-automation/helpers";
import type { AgendaGroup, AppDictionary } from "./types";

export function GeneratedAgendaSection({ dictionary, groupedAgenda }: { dictionary: AppDictionary; groupedAgenda: AgendaGroup[] }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.generatedSection}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.generatedDescription}</p>
      </div>
      <div className="p-6">
        <p className="text-sm font-semibold text-ink">{dictionary.contentAutomation.generatedAgendaTitle}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.generatedAgendaDescription}</p>
        {groupedAgenda.length === 0 ? <p className="mt-5 text-sm text-slate-500">{dictionary.contentAutomation.noAgenda}</p> : <div className="mt-6 grid gap-4">{groupedAgenda.map((item) => <AgendaGroupCard key={`${item.date}-${item.day}`} dictionary={dictionary} item={item} />)}</div>}
      </div>
    </Panel>
  );
}

function AgendaGroupCard({ dictionary, item }: { dictionary: AppDictionary; item: AgendaGroup }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"><span>{item.day}</span><span>{item.date}</span><span>{item.items.length} {item.items.length === 1 ? dictionary.contentAutomation.singlePostLabel : dictionary.contentAutomation.multiplePostsLabel}</span></div>
      <h3 className="mt-3 text-xl font-semibold text-ink">{item.theme}</h3>
      <p className="mt-2 text-sm text-slate-600">{item.type} · {item.goal}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">{renderAgendaMeta(dictionary.contentAutomation.dayGoal, item.goal)}{renderAgendaMeta(dictionary.contentAutomation.dayTypes, item.type)}{renderAgendaMeta(dictionary.contentAutomation.dayFormats, item.format)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{dictionary.contentAutomation.structure}</p><div className="mt-2 space-y-2 text-sm text-slate-600">{item.structure.map((step, index) => <p key={`${item.date}-${item.time}-${index}`}>{index + 1}. {step}</p>)}</div></div><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{dictionary.common.caption}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.caption}</p></div><div className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{dictionary.contentAutomation.visualIdea}</p><p className="mt-2 text-sm text-slate-600">{item.visualIdea}</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">CTA</p><p className="mt-2 text-sm text-slate-600">{item.cta}</p></div></div></div>
    </div>
  );
}
