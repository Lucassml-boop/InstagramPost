import type { AgendaSectionsProps } from "./types";

export function GenerationStatusCard({
  dictionary,
  generationStatus,
  now
}: Pick<AgendaSectionsProps, "dictionary" | "generationStatus"> & { now: number }) {
  if (generationStatus.state === "idle") {
    return null;
  }

  const elapsedNow =
    generationStatus.state === "completed" || generationStatus.state === "failed"
      ? generationStatus.completedAt ?? now
      : now;
  const elapsedMs =
    generationStatus.startedAt !== null ? Math.max(elapsedNow - generationStatus.startedAt, 0) : 0;
  const phaseElapsedMs =
    generationStatus.phaseStartedAt !== null ? Math.max(now - generationStatus.phaseStartedAt, 0) : 0;
  const isPossiblyStalled = generationStatus.state === "running" && phaseElapsedMs >= 120_000;
  const stepIndex = getStepIndex(generationStatus);
  const hasQuantifiedProgress =
    generationStatus.totalPosts !== null &&
    generationStatus.totalPosts > 0 &&
    generationStatus.preparedCount !== null;
  const progressPercent = getProgressPercent(generationStatus, stepIndex, hasQuantifiedProgress);

  return (
    <div className={`mt-5 rounded-3xl border px-5 py-5 ${getStatusCardClass(generationStatus.state, isPossiblyStalled)}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {dictionary.contentAutomation.generationStatusLabel ?? "Status da geracao"}
          </p>
          <p className="mt-2 text-base font-semibold text-ink">
            {getGenerationHeadline(dictionary, generationStatus.state, generationStatus.phase, isPossiblyStalled)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {getGenerationDescription(dictionary, generationStatus, isPossiblyStalled)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {dictionary.contentAutomation.generationElapsedLabel ?? "Tempo decorrido"}
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">{formatElapsed(elapsedMs)}</p>
          {hasQuantifiedProgress ? (
            <p className="mt-1 text-xs font-medium text-slate-600">
              {generationStatus.preparedCount}/{generationStatus.totalPosts} concluido(s)
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${getProgressClass(generationStatus.state, isPossiblyStalled)}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StepPill label={dictionary.contentAutomation.generationStepSaving ?? "Salvando configuracoes"} active={generationStatus.phase === "saving-settings"} completed={stepIndex > 1 || generationStatus.state === "completed"} />
        <StepPill label={dictionary.contentAutomation.generationStepPlanning ?? "Gerando agenda"} active={generationStatus.phase === "generating-plan"} completed={stepIndex > 2 || generationStatus.state === "completed"} />
        <StepPill label={dictionary.contentAutomation.generationStepRefreshing ?? "Atualizando dados"} active={generationStatus.phase === "refreshing-data"} completed={generationStatus.state === "completed"} />
      </div>

      {generationStatus.detailMessage ? (
        <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-700">
          {generationStatus.detailMessage}
          {generationStatus.currentPostIndex !== null && generationStatus.totalPosts !== null ? (
            <span className="ml-1 font-medium text-ink">
              ({generationStatus.currentPostIndex}/{generationStatus.totalPosts})
            </span>
          ) : null}
        </div>
      ) : null}

      {generationStatus.scannedCount !== null && generationStatus.scannedCount > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">
            Preparados: {generationStatus.preparedCount ?? 0}
          </span>
          <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">
            Na fila: {generationStatus.scannedCount}
          </span>
          {generationStatus.activeTheme ? (
            <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">
              Atual: {generationStatus.activeTheme}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StepPill({ label, active, completed }: { label: string; active: boolean; completed: boolean }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${active ? "border-sky-300 bg-white text-sky-900" : completed ? "border-emerald-200 bg-white text-emerald-800" : "border-slate-200 bg-white/70 text-slate-500"}`}>
      {label}
    </div>
  );
}

function getStepIndex(generationStatus: AgendaSectionsProps["generationStatus"]) {
  return generationStatus.phase === "saving-settings"
    ? 1
    : generationStatus.phase === "generating-plan"
      ? 2
      : generationStatus.phase === "refreshing-data" || generationStatus.state === "completed"
        ? 3
        : 0;
}

function getProgressPercent(
  generationStatus: AgendaSectionsProps["generationStatus"],
  stepIndex: number,
  hasQuantifiedProgress: boolean
) {
  if (generationStatus.state === "completed" || generationStatus.state === "failed") {
    return 100;
  }
  if (hasQuantifiedProgress) {
    const quantified = Math.round((generationStatus.preparedCount! / generationStatus.totalPosts!) * 100);
    return Math.max(generationStatus.phase === "refreshing-data" ? 72 : 0, Math.min(100, Math.max(0, quantified)));
  }
  return stepIndex === 1 ? 24 : stepIndex === 2 ? 62 : 88;
}

function getStatusCardClass(state: AgendaSectionsProps["generationStatus"]["state"], isPossiblyStalled: boolean) {
  return state === "failed"
    ? "border-rose-200 bg-rose-50"
    : state === "completed"
      ? "border-emerald-200 bg-emerald-50"
      : isPossiblyStalled
        ? "border-amber-200 bg-amber-50"
        : "border-sky-200 bg-sky-50";
}

function getProgressClass(state: AgendaSectionsProps["generationStatus"]["state"], isPossiblyStalled: boolean) {
  return state === "failed"
    ? "bg-rose-500"
    : state === "completed"
      ? "bg-emerald-500"
      : isPossiblyStalled
        ? "bg-amber-500"
        : "bg-sky-500";
}

function getGenerationHeadline(
  dictionary: AgendaSectionsProps["dictionary"],
  state: AgendaSectionsProps["generationStatus"]["state"],
  phase: AgendaSectionsProps["generationStatus"]["phase"],
  isPossiblyStalled: boolean
) {
  if (state === "completed") return dictionary.contentAutomation.generationCompletedTitle ?? "Agenda concluida";
  if (state === "failed") return dictionary.contentAutomation.generationFailedTitle ?? "Falha na geracao";
  if (isPossiblyStalled) return dictionary.contentAutomation.generationStalledTitle ?? "Possivel demora detectada";
  if (phase === "saving-settings") return dictionary.contentAutomation.generationSavingTitle ?? "Salvando configuracoes";
  if (phase === "generating-plan") return dictionary.contentAutomation.generationPlanningTitle ?? "Gerando agenda";
  return dictionary.contentAutomation.generationRefreshingTitle ?? "Atualizando dados finais";
}

function getGenerationDescription(
  dictionary: AgendaSectionsProps["dictionary"],
  generationStatus: AgendaSectionsProps["generationStatus"],
  isPossiblyStalled: boolean
) {
  if (generationStatus.state === "completed") {
    return generationStatus.detailMessage || dictionary.contentAutomation.generationCompletedDescription || "A agenda foi gerada e os dados foram atualizados na tela.";
  }
  if (generationStatus.state === "failed") {
    return generationStatus.errorMessage || dictionary.contentAutomation.generationFailedDescription || "A geracao encontrou um erro.";
  }
  if (generationStatus.detailMessage) return generationStatus.detailMessage;
  if (isPossiblyStalled) return dictionary.contentAutomation.generationStalledDescription ?? "A geracao ainda esta em andamento. O backend pode estar pesquisando temas, criando os posts e renderizando as imagens, o que pode levar varios minutos.";
  if (generationStatus.phase === "saving-settings") return dictionary.contentAutomation.generationSavingDescription ?? "Guardando a configuracao atual antes de montar a agenda.";
  if (generationStatus.phase === "generating-plan") return dictionary.contentAutomation.generationPlanningDescription ?? "Pesquisando temas, montando a agenda e preparando os posts ligados a ela.";
  return dictionary.contentAutomation.generationRefreshingDescription ?? "Atualizando agenda, topicos e dados derivados depois da geracao.";
}

function formatElapsed(valueMs: number) {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
