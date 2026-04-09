export { ContentAutomationSettings } from "@/components/content-automation";
/*

  const builtProfile = useMemo(
    () =>
      buildProfileFromState({
        brandName,
        editableBrief,
        automationLoopEnabled,
        topicsHistoryCleanupFrequency,
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
      topicsHistoryCleanupFrequency,
      services,
      carouselDefaultStructure,
      contentRules,
      researchQueries,
      daySettings
    ]
  );
  const uniqueTopicsHistory = useMemo(
    () => Array.from(new Set(topicsHistory.map((topic) => topic.trim()).filter(Boolean))),
    [topicsHistory]
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
        await saveBrandProfileService(builtProfile);

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
        await saveBrandProfileService(builtProfile);
        const json = await generateWeeklyAgendaService();

        setAgenda(json.agenda ?? []);
        setCurrentTopics(json.currentTopics ?? []);
        const topicsHistoryJson = await fetchTopicsHistoryService();
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
        const json = await clearTopicsHistoryService();

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

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.strategySection}
          </p>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {dictionary.contentAutomation.strategyDescription}
          </p>
        </div>
        <div className="p-6">
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

            <label className="block text-sm font-medium text-slate-700">
              <span>{dictionary.contentAutomation.topicsHistoryCleanupFrequency}</span>
              <select
                value={topicsHistoryCleanupFrequency}
                onChange={(event) =>
                  setTopicsHistoryCleanupFrequency(
                    event.target.value as "disabled" | "daily" | "weekly" | "monthly"
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400"
              >
                <option value="disabled">
                  {dictionary.contentAutomation.cleanupFrequencyDisabled}
                </option>
                <option value="daily">
                  {dictionary.contentAutomation.cleanupFrequencyDaily}
                </option>
                <option value="weekly">
                  {dictionary.contentAutomation.cleanupFrequencyWeekly}
                </option>
                <option value="monthly">
                  {dictionary.contentAutomation.cleanupFrequencyMonthly}
                </option>
              </select>
              <span className="mt-2 block text-sm text-slate-600">
                {dictionary.contentAutomation.topicsHistoryCleanupDescription}
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
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {dictionary.contentAutomation.sourcesSection}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.sourcesDescription}
            </p>
          </div>
          <div className="p-6">
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
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {dictionary.contentAutomation.automationSection}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {dictionary.contentAutomation.automationDescription}
            </p>
          </div>
          <div className="p-6">
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
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.memorySection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.memoryDescription}
          </p>
        </div>
        <div className="p-6">
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

        {uniqueTopicsHistory.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            {dictionary.contentAutomation.noTopicsHistory}
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {uniqueTopicsHistory.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.agendaRulesSection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.agendaRulesDescription}
          </p>
        </div>
        <div className="p-6">
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
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {dictionary.contentAutomation.generatedSection}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {dictionary.contentAutomation.generatedDescription}
          </p>
        </div>
        <div className="p-6">
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
        </div>
      </Panel>
    </div>
  );
}
*/
