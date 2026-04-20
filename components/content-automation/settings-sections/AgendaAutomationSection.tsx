import { useEffect, useState } from "react";
import { Panel } from "@/components/shared";
import type { AgendaSectionsProps } from "./types";

export function AgendaAutomationSection(props: Pick<AgendaSectionsProps, "dictionary" | "saveSettings" | "generateWeeklyAgenda" | "cancelWeeklyGeneration" | "isSaving" | "isGenerating" | "currentTopics" | "generationStatus" | "daySettings">) {
  const { dictionary } = props;
  const [now, setNow] = useState(() => Date.now());
  const validationSummary = getAgendaValidationSummary(props.daySettings);
  const canGenerateAgenda = validationSummary.validConfirmedSlots > 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.automationSection}</p>
        <p className="mt-2 text-sm text-slate-600">{dictionary.contentAutomation.automationDescription}</p>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={props.saveSettings} disabled={props.isSaving || props.isGenerating} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {props.isSaving ? dictionary.contentAutomation.saving : dictionary.contentAutomation.saveButton}
          </button>
          <button type="button" onClick={props.generateWeeklyAgenda} disabled={props.isSaving || props.isGenerating || !canGenerateAgenda} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">
            {props.isGenerating ? dictionary.contentAutomation.generating : dictionary.contentAutomation.generateButton}
          </button>
          {props.isGenerating ? (
            <button type="button" onClick={props.cancelWeeklyGeneration} className="rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800">
              {dictionary.contentAutomation.cancelGeneration ?? "Cancelar"}
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-slate-600">{dictionary.contentAutomation.generateHint}</p>
        {!canGenerateAgenda ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-950">
              {dictionary.contentAutomation.invalidAgendaSetupTitle ?? "A agenda ainda nao pode ser gerada"}
            </p>
            <p className="mt-2 text-sm text-amber-900">
              {getAgendaValidationMessage(dictionary, validationSummary)}
            </p>
          </div>
        ) : null}
        <GenerationStatusCard
          dictionary={dictionary}
          generationStatus={props.generationStatus}
          now={now}
        />
        {props.currentTopics.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{dictionary.contentAutomation.currentTopics}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {props.currentTopics.map((topic) => <span key={topic} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">{topic}</span>)}
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function GenerationStatusCard({
  dictionary,
  generationStatus,
  now
}: Pick<AgendaSectionsProps, "dictionary" | "generationStatus"> & { now: number }) {
  if (generationStatus.state === "idle") {
    return null;
  }

  const elapsedMs =
    generationStatus.startedAt !== null ? Math.max(now - generationStatus.startedAt, 0) : 0;
  const phaseElapsedMs =
    generationStatus.phaseStartedAt !== null
      ? Math.max(now - generationStatus.phaseStartedAt, 0)
      : 0;
  const isPossiblyStalled = generationStatus.state === "running" && phaseElapsedMs >= 120_000;
  const stepIndex =
    generationStatus.phase === "saving-settings"
      ? 1
      : generationStatus.phase === "generating-plan"
        ? 2
        : generationStatus.phase === "refreshing-data"
          ? 3
          : generationStatus.state === "completed"
            ? 3
            : generationStatus.state === "failed"
              ? 0
              : 0;
  const hasQuantifiedProgress =
    generationStatus.totalPosts !== null &&
    generationStatus.totalPosts > 0 &&
    generationStatus.preparedCount !== null;
  const quantifiedProgressPercent = hasQuantifiedProgress
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round((generationStatus.preparedCount! / generationStatus.totalPosts!) * 100)
        )
      )
    : null;
  const progressPercent =
    generationStatus.state === "completed"
      ? 100
      : generationStatus.state === "failed"
        ? 100
        : quantifiedProgressPercent !== null
          ? Math.max(
              generationStatus.phase === "refreshing-data" ? 72 : 0,
              quantifiedProgressPercent
            )
          : stepIndex === 1
            ? 24
            : stepIndex === 2
              ? 62
              : 88;

  return (
    <div
      className={`mt-5 rounded-3xl border px-5 py-5 ${
        generationStatus.state === "failed"
          ? "border-rose-200 bg-rose-50"
          : generationStatus.state === "completed"
            ? "border-emerald-200 bg-emerald-50"
            : isPossiblyStalled
              ? "border-amber-200 bg-amber-50"
              : "border-sky-200 bg-sky-50"
      }`}
    >
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
          className={`h-full rounded-full transition-[width] duration-700 ${
            generationStatus.state === "failed"
              ? "bg-rose-500"
              : generationStatus.state === "completed"
                ? "bg-emerald-500"
                : isPossiblyStalled
                  ? "bg-amber-500"
                  : "bg-sky-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StepPill
          label={dictionary.contentAutomation.generationStepSaving ?? "Salvando configuracoes"}
          active={generationStatus.phase === "saving-settings"}
          completed={stepIndex > 1 || generationStatus.state === "completed"}
        />
        <StepPill
          label={dictionary.contentAutomation.generationStepPlanning ?? "Gerando agenda"}
          active={generationStatus.phase === "generating-plan"}
          completed={stepIndex > 2 || generationStatus.state === "completed"}
        />
        <StepPill
          label={dictionary.contentAutomation.generationStepRefreshing ?? "Atualizando dados"}
          active={generationStatus.phase === "refreshing-data"}
          completed={generationStatus.state === "completed"}
        />
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

function StepPill({
  label,
  active,
  completed
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
        active
          ? "border-sky-300 bg-white text-sky-900"
          : completed
            ? "border-emerald-200 bg-white text-emerald-800"
            : "border-slate-200 bg-white/70 text-slate-500"
      }`}
    >
      {label}
    </div>
  );
}

function getGenerationHeadline(
  dictionary: AgendaSectionsProps["dictionary"],
  state: AgendaSectionsProps["generationStatus"]["state"],
  phase: AgendaSectionsProps["generationStatus"]["phase"],
  isPossiblyStalled: boolean
) {
  if (state === "completed") {
    return dictionary.contentAutomation.generationCompletedTitle ?? "Agenda concluida";
  }

  if (state === "failed") {
    return dictionary.contentAutomation.generationFailedTitle ?? "Falha na geracao";
  }

  if (isPossiblyStalled) {
    return dictionary.contentAutomation.generationStalledTitle ?? "Possivel demora detectada";
  }

  if (phase === "saving-settings") {
    return dictionary.contentAutomation.generationSavingTitle ?? "Salvando configuracoes";
  }

  if (phase === "generating-plan") {
    return dictionary.contentAutomation.generationPlanningTitle ?? "Gerando agenda";
  }

  return dictionary.contentAutomation.generationRefreshingTitle ?? "Atualizando dados finais";
}

function getGenerationDescription(
  dictionary: AgendaSectionsProps["dictionary"],
  generationStatus: AgendaSectionsProps["generationStatus"],
  isPossiblyStalled: boolean
) {
  if (generationStatus.state === "completed") {
    return (
      generationStatus.detailMessage ||
      dictionary.contentAutomation.generationCompletedDescription ||
      "A agenda foi gerada e os dados foram atualizados na tela."
    );
  }

  if (generationStatus.state === "failed") {
    return generationStatus.errorMessage || dictionary.contentAutomation.generationFailedDescription || "A geracao encontrou um erro.";
  }

  if (generationStatus.detailMessage) {
    return generationStatus.detailMessage;
  }

  if (isPossiblyStalled) {
    return dictionary.contentAutomation.generationStalledDescription ?? "A geracao ainda esta em andamento. O backend pode estar pesquisando temas, criando os posts e renderizando as imagens, o que pode levar varios minutos.";
  }

  if (generationStatus.phase === "saving-settings") {
    return dictionary.contentAutomation.generationSavingDescription ?? "Guardando a configuracao atual antes de montar a agenda.";
  }

  if (generationStatus.phase === "generating-plan") {
    return dictionary.contentAutomation.generationPlanningDescription ?? "Pesquisando temas, montando a agenda e preparando os posts ligados a ela.";
  }

  return dictionary.contentAutomation.generationRefreshingDescription ?? "Atualizando agenda, topicos e dados derivados depois da geracao.";
}

function formatElapsed(valueMs: number) {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getAgendaValidationSummary(daySettings: AgendaSectionsProps["daySettings"]) {
  const allDays = Object.values(daySettings);
  const enabledDays = allDays.filter((day) => day.enabled);
  const daysWithValidTime = enabledDays.filter((day) =>
    day.postIdeas.some((idea, index) => {
      const timeValue = day.postTimes
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)[index];

      return Boolean(timeValue && /^\d{2}:\d{2}$/.test(timeValue));
    })
  );
  const validConfirmedSlots = enabledDays.reduce((total, day) => {
    const times = day.postTimes
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    return (
      total +
      day.postIdeas.filter((idea, index) => idea.confirmed && Boolean(times[index] && /^\d{2}:\d{2}$/.test(times[index] ?? ""))).length
    );
  }, 0);

  return {
    enabledDaysCount: enabledDays.length,
    daysWithValidTimeCount: daysWithValidTime.length,
    validConfirmedSlots
  };
}

function getAgendaValidationMessage(
  dictionary: AgendaSectionsProps["dictionary"],
  summary: ReturnType<typeof getAgendaValidationSummary>
) {
  if (summary.enabledDaysCount === 0) {
    return dictionary.contentAutomation.invalidAgendaSetupNoDays ?? "Ative pelo menos um dia na cadencia semanal para liberar a geracao da agenda.";
  }

  if (summary.daysWithValidTimeCount === 0) {
    return dictionary.contentAutomation.invalidAgendaSetupNoTimes ?? "Defina pelo menos um horario valido no formato HH:mm em um dos dias ativos.";
  }

  return dictionary.contentAutomation.invalidAgendaSetupNoConfirmedSlots ?? "Confirme pelo menos um slot de post em um dia ativo com horario valido para gerar a agenda.";
}
