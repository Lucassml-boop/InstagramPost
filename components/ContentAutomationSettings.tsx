"use client";

import { useMemo, useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/ui";
import type { BrandProfile, ContentPlanItem } from "@/lib/content-system";

type DayLabel = "Segunda" | "Terca" | "Quarta" | "Quinta" | "Sexta";

type Props = {
  initialProfile: BrandProfile;
  initialAgenda: ContentPlanItem[];
  initialTopicsHistory: string[];
};

const DAY_ORDER: DayLabel[] = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"];

type DaySettingsState = Record<
  DayLabel,
  {
    goal: string;
    contentTypes: string;
    formats: string;
  }
>;

function toTextareaValue(items: string[]) {
  return items.join("\n");
}

function fromTextareaValue(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDayState(profile: BrandProfile): DaySettingsState {
  return DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = {
        goal: profile.weeklyAgenda[day]?.goal ?? "",
        contentTypes: toTextareaValue(profile.weeklyAgenda[day]?.contentTypes ?? []),
        formats: toTextareaValue(profile.weeklyAgenda[day]?.formats ?? [])
      };
      return acc;
    },
    {} as DaySettingsState
  );
}

function buildProfileFromState(input: {
  brandName: string;
  editableBrief: string;
  automationLoopEnabled: boolean;
  services: string;
  carouselDefaultStructure: string;
  contentRules: string;
  researchQueries: string;
  daySettings: DaySettingsState;
}): BrandProfile {
  return {
    brandName: input.brandName.trim(),
    editableBrief: input.editableBrief.trim(),
    automationLoopEnabled: input.automationLoopEnabled,
    services: fromTextareaValue(input.services),
    weeklyAgenda: DAY_ORDER.reduce(
      (acc, day) => {
        acc[day] = {
          goal: input.daySettings[day].goal.trim(),
          contentTypes: fromTextareaValue(input.daySettings[day].contentTypes),
          formats: fromTextareaValue(input.daySettings[day].formats)
        };
        return acc;
      },
      {} as BrandProfile["weeklyAgenda"]
    ),
    carouselDefaultStructure: fromTextareaValue(input.carouselDefaultStructure),
    contentRules: fromTextareaValue(input.contentRules),
    researchQueries: fromTextareaValue(input.researchQueries)
  };
}

export function ContentAutomationSettings({
  initialProfile,
  initialAgenda,
  initialTopicsHistory
}: Props) {
  const { dictionary } = useI18n();
  const [brandName, setBrandName] = useState(initialProfile.brandName);
  const [editableBrief, setEditableBrief] = useState(initialProfile.editableBrief);
  const [automationLoopEnabled, setAutomationLoopEnabled] = useState(
    initialProfile.automationLoopEnabled
  );
  const [services, setServices] = useState(toTextareaValue(initialProfile.services));
  const [carouselDefaultStructure, setCarouselDefaultStructure] = useState(
    toTextareaValue(initialProfile.carouselDefaultStructure)
  );
  const [contentRules, setContentRules] = useState(toTextareaValue(initialProfile.contentRules));
  const [researchQueries, setResearchQueries] = useState(
    toTextareaValue(initialProfile.researchQueries)
  );
  const [daySettings, setDaySettings] = useState(buildDayState(initialProfile));
  const [agenda, setAgenda] = useState(initialAgenda);
  const [topicsHistory, setTopicsHistory] = useState(initialTopicsHistory);
  const [currentTopics, setCurrentTopics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();

  const builtProfile = useMemo(
    () =>
      buildProfileFromState({
        brandName,
        editableBrief,
        automationLoopEnabled,
        services,
        carouselDefaultStructure,
        contentRules,
        researchQueries,
        daySettings
      }),
    [
      brandName,
      editableBrief,
      automationLoopEnabled,
      services,
      carouselDefaultStructure,
      contentRules,
      researchQueries,
      daySettings
    ]
  );

  function updateDay(day: DayLabel, field: "goal" | "contentTypes" | "formats", value: string) {
    setDaySettings((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value
      }
    }));
  }

  function saveSettings() {
    setMessage(null);
    setError(null);

    startSaving(async () => {
      try {
        const response = await fetch("/api/content-system/brand-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(builtProfile)
        });

        const json = (await response.json()) as { error?: string; profile?: BrandProfile };

        if (!response.ok) {
          setError(json.error ?? dictionary.contentAutomation.saveError);
          return;
        }

        setMessage(dictionary.contentAutomation.saveSuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : dictionary.contentAutomation.saveError
        );
      }
    });
  }

  function generateWeeklyAgenda() {
    setMessage(null);
    setError(null);

    startGenerating(async () => {
      try {
        const saveResponse = await fetch("/api/content-system/brand-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(builtProfile)
        });

        const savedJson = (await saveResponse.json()) as { error?: string };

        if (!saveResponse.ok) {
          setError(savedJson.error ?? dictionary.contentAutomation.saveError);
          return;
        }

        const response = await fetch("/api/content-system/generate-weekly", {
          method: "POST"
        });

        const json = (await response.json()) as {
          error?: string;
          agenda?: ContentPlanItem[];
          currentTopics?: string[];
        };

        if (!response.ok) {
          setError(json.error ?? dictionary.contentAutomation.generateError);
          return;
        }

        setAgenda(json.agenda ?? []);
        setCurrentTopics(json.currentTopics ?? []);
        const topicsHistoryResponse = await fetch("/api/content-system/topics-history");
        const topicsHistoryJson = (await topicsHistoryResponse.json()) as {
          topicsHistory?: string[];
        };
        setTopicsHistory(topicsHistoryJson.topicsHistory ?? []);
        setMessage(dictionary.contentAutomation.generateSuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : dictionary.contentAutomation.generateError
        );
      }
    });
  }

  function clearTopicsHistory() {
    setMessage(null);
    setError(null);

    startSaving(async () => {
      try {
        const response = await fetch("/api/content-system/topics-history", {
          method: "DELETE"
        });

        const json = (await response.json()) as { error?: string; topicsHistory?: string[] };

        if (!response.ok) {
          setError(json.error ?? dictionary.contentAutomation.clearTopicsHistoryError);
          return;
        }

        setTopicsHistory(json.topicsHistory ?? []);
        setMessage(dictionary.contentAutomation.clearTopicsHistorySuccess);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : dictionary.contentAutomation.clearTopicsHistoryError
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={
            error
              ? "rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          }
        >
          {error ?? message}
        </div>
      )}

      <Panel className="p-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.brandName}</span>
              <input
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.editableBrief}</span>
              <textarea
                value={editableBrief}
                onChange={(event) => setEditableBrief(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={automationLoopEnabled}
                onChange={(event) => setAutomationLoopEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-ink focus:ring-ink"
              />
              <span>
                <span className="block font-semibold text-ink">
                  {dictionary.contentAutomation.automationLoopEnabled}
                </span>
                <span className="mt-1 block text-slate-600">
                  {dictionary.contentAutomation.automationLoopDescription}
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-ink">
              {dictionary.contentAutomation.howItWorksTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.howItWorksDescription}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {dictionary.contentAutomation.scheduleLabel}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.scheduleDescription}
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.services}</span>
              <textarea
                value={services}
                onChange={(event) => setServices(event.target.value)}
                rows={8}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.contentRules}</span>
              <textarea
                value={contentRules}
                onChange={(event) => setContentRules(event.target.value)}
                rows={8}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.researchQueries}</span>
              <textarea
                value={researchQueries}
                onChange={(event) => setResearchQueries(event.target.value)}
                rows={8}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.carouselDefaultStructure}</span>
              <textarea
                value={carouselDefaultStructure}
                onChange={(event) => setCarouselDefaultStructure(event.target.value)}
                rows={8}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              />
            </label>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {dictionary.contentAutomation.listHint}
          </p>
        </Panel>

        <Panel className="p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSaving || isGenerating}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? dictionary.contentAutomation.saving
                : dictionary.contentAutomation.saveButton}
            </button>
            <button
              type="button"
              onClick={generateWeeklyAgenda}
              disabled={isSaving || isGenerating}
              className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating
                ? dictionary.contentAutomation.generating
                : dictionary.contentAutomation.generateButton}
            </button>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            {dictionary.contentAutomation.generateHint}
          </p>

          {currentTopics.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {dictionary.contentAutomation.currentTopics}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">
              {dictionary.contentAutomation.topicsHistoryTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.topicsHistoryDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={clearTopicsHistory}
            disabled={isSaving || isGenerating}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dictionary.contentAutomation.clearTopicsHistory}
          </button>
        </div>

        {topicsHistory.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            {dictionary.contentAutomation.noTopicsHistory}
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {topicsHistory.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              {dictionary.contentAutomation.weeklyAgendaTitle}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.weeklyAgendaDescription}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {DAY_ORDER.map((day) => (
            <div key={day} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-base font-semibold text-ink">{day}</p>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                <span>{dictionary.contentAutomation.dayGoal}</span>
                <textarea
                  value={daySettings[day].goal}
                  onChange={(event) => updateDay(day, "goal", event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                <span>{dictionary.contentAutomation.dayTypes}</span>
                <textarea
                  value={daySettings[day].contentTypes}
                  onChange={(event) => updateDay(day, "contentTypes", event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                <span>{dictionary.contentAutomation.dayFormats}</span>
                <textarea
                  value={daySettings[day].formats}
                  onChange={(event) => updateDay(day, "formats", event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
                />
              </label>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <p className="text-sm font-semibold text-ink">
          {dictionary.contentAutomation.generatedAgendaTitle}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {dictionary.contentAutomation.generatedAgendaDescription}
        </p>

        {agenda.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            {dictionary.contentAutomation.noAgenda}
          </p>
        ) : (
          <div className="mt-6 grid gap-4">
            {agenda.map((item) => (
              <div key={`${item.date}-${item.day}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <span>{item.day}</span>
                  <span>{item.date}</span>
                  <span>{item.format}</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-ink">{item.theme}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {item.type} · {item.goal}
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {dictionary.contentAutomation.structure}
                    </p>
                    <div className="mt-2 space-y-2 text-sm text-slate-600">
                      {item.structure.map((step, index) => (
                        <p key={`${item.date}-${index}`}>{index + 1}. {step}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {dictionary.common.caption}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.caption}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {dictionary.contentAutomation.visualIdea}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{item.visualIdea}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        CTA
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{item.cta}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
