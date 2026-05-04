import type { AgendaSectionsProps } from "./types";

export function getAgendaValidationSummary(daySettings: AgendaSectionsProps["daySettings"]) {
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

export function getAgendaValidationMessage(
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
