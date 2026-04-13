import { Panel } from "@/components/shared";
import { DAY_ORDER } from "@/components/content-automation/utils";
import { togglePresetInTextarea } from "@/components/content-automation/helpers";
import type { AgendaSectionsProps } from "./types";

export function AgendaRulesSection(props: AgendaSectionsProps) {
  const { dictionary } = props;

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.agendaRulesSection}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.agendaRulesDescription}</p>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold text-ink">{dictionary.contentAutomation.weeklyAgendaTitle}</p><p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.weeklyAgendaDescription}</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => props.setAllDaysEnabled(true)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink">{dictionary.contentAutomation.enableAllDays}</button>
            <button type="button" onClick={() => props.setAllDaysEnabled(false)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink">{dictionary.contentAutomation.disableAllDays}</button>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {DAY_ORDER.map((day) => (
            <div key={day} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-base font-semibold text-ink">{day}</p><p className="mt-1 text-sm text-slate-600">{props.daySettings[day].enabled ? `${props.daySettings[day].postsPerDay} ${dictionary.contentAutomation.dayPostsSummary}` : dictionary.contentAutomation.dayDisabledSummary}</p></div>
                <button type="button" onClick={() => props.toggleExpandedDay(day)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink">{props.expandedDays[day] ? dictionary.contentAutomation.showLessDay : dictionary.contentAutomation.showMoreDay}</button>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <input type="checkbox" checked={props.daySettings[day].enabled} onChange={(event) => props.toggleDay(day, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-ink focus:ring-ink" />
                <span className="text-sm font-medium text-slate-700">{dictionary.contentAutomation.dayEnabled}</span>
              </div>
              {props.expandedDays[day] ? (
                <ExpandedDayEditor day={day} {...props} />
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{dictionary.contentAutomation.dayGoal}</p><p className="mt-2 text-sm text-slate-600">{props.daySettings[day].postIdeas[0]?.goal || dictionary.contentAutomation.noDayGoal}</p></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ExpandedDayEditor({ day, dictionary, daySettings, updateDay, postTimesByDay, updateDayPostTime, renderPresetPicker, goalPresetItems, contentTypePresetItems, formatPresetItems, generateAutomaticPostIdea, updateDayPostIdea }: AgendaSectionsProps & { day: keyof AgendaSectionsProps["daySettings"] }) {
  return (
    <>
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700">
          <span>{dictionary.contentAutomation.postsPerDay}</span>
          <input type="number" min={1} max={10} value={daySettings[day].postsPerDay} onChange={(event) => updateDay(day, "postsPerDay", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" />
        </label>
      </div>
      <div className="mt-4 space-y-4">
        {daySettings[day].postIdeas.map((idea, index) => (
          <div key={`${String(day)}-idea-${index}`} className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-ink">{dictionary.contentAutomation.postLabel} {index + 1}</p>
            <label className="mt-4 block text-sm font-medium text-slate-700"><span>{dictionary.contentAutomation.postTimes}</span><input type="time" value={postTimesByDay[day][index] ?? ""} onChange={(event) => updateDayPostTime(day, index, event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" /></label>
            <FieldWithPicker label={dictionary.contentAutomation.dayGoal} picker={renderPresetPicker({ pickerKey: `${String(day)}-${index}-goal`, presetsList: goalPresetItems, value: idea.goal, onAuto: () => generateAutomaticPostIdea(day, index), onSelectPreset: (preset) => updateDayPostIdea(day, index, "goal", preset) })}><textarea value={idea.goal} onChange={(event) => updateDayPostIdea(day, index, "goal", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" /></FieldWithPicker>
            <FieldWithPicker label={dictionary.contentAutomation.dayTypes} picker={renderPresetPicker({ pickerKey: `${String(day)}-${index}-types`, presetsList: contentTypePresetItems, value: idea.contentTypes, multiselect: true, onAuto: () => generateAutomaticPostIdea(day, index), onSelectPreset: (preset) => updateDayPostIdea(day, index, "contentTypes", togglePresetInTextarea(idea.contentTypes, preset)) })}><textarea value={idea.contentTypes} onChange={(event) => updateDayPostIdea(day, index, "contentTypes", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" /></FieldWithPicker>
            <FieldWithPicker label={dictionary.contentAutomation.dayFormats} picker={renderPresetPicker({ pickerKey: `${String(day)}-${index}-formats`, presetsList: formatPresetItems, value: idea.formats, multiselect: true, onAuto: () => generateAutomaticPostIdea(day, index), onSelectPreset: (preset) => updateDayPostIdea(day, index, "formats", togglePresetInTextarea(idea.formats, preset)) })}><textarea value={idea.formats} onChange={(event) => updateDayPostIdea(day, index, "formats", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400" /></FieldWithPicker>
          </div>
        ))}
      </div>
    </>
  );
}

function FieldWithPicker({ label, picker, children }: { label: string; picker: React.ReactNode; children: React.ReactNode }) {
  return <label className="mt-4 block text-sm font-medium text-slate-700"><div className="flex items-center justify-between gap-3"><span>{label}</span>{picker}</div>{children}</label>;
}
