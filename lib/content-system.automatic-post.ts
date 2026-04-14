import { z } from "zod";
import { DAY_ORDER } from "./content-system.constants.ts";
import { buildFallbackAutomaticPostIdea } from "./content-system.fallbacks.ts";
import { requestAutomaticPostIdea } from "./content-system.requests.ts";
import { getDayConfig, expandPostTimes } from "./content-system.schedule.ts";
import { brandProfileSchema } from "./content-system.schemas.ts";

export async function generateAutomaticPostIdea(input: {
  profile: unknown;
  day: string;
  postIndex: number;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const day = z.enum(DAY_ORDER).parse(input.day);
  const postIndex = Math.max(0, Math.min(9, Math.trunc(input.postIndex)));
  const dayConfig = getDayConfig(profile, day);
  const siblingIdeas = dayConfig.postIdeas
    .map((idea, index) => ({ ...idea, slot: index + 1 }))
    .filter(
      (idea, index) =>
        index !== postIndex &&
        (idea.goal || idea.contentTypes.length > 0 || idea.formats.length > 0)
    );
  const weeklySiblingIdeas = DAY_ORDER.flatMap((weekDay) => {
    const config = getDayConfig(profile, weekDay);

    return config.postIdeas
      .map((idea, index) => ({
        ...idea,
        day: weekDay,
        slot: index + 1
      }))
      .filter((idea, index) => {
        const isCurrentTarget = weekDay === day && index === postIndex;
        return (
          !isCurrentTarget &&
          (idea.goal || idea.contentTypes.length > 0 || idea.formats.length > 0)
        );
      });
  });
  const prompt = [
    "Crie um direcionamento editorial detalhado para um unico post de Instagram em portugues do Brasil.",
    "Retorne somente JSON valido com as chaves goal, contentTypes e formats.",
    "goal deve ser um objetivo mais elaborado, em 1 ou 2 frases, explicando o papel estrategico do post.",
    "contentTypes deve ter entre 3 e 6 tipos de conteudo, cada item com mais contexto e especificidade, evitando respostas curtas demais.",
    "formats deve ter entre 3 e 5 sugestoes de formato para Instagram, mais detalhadas e acionaveis do que nomes simples.",
    "Nao repita a mesma linha editorial dos outros posts do mesmo dia.",
    "Tambem evite duplicar a mesma ideia central, abordagem ou formato dos outros posts ja configurados ao longo da semana.",
    "",
    `Marca: ${profile.brandName}`,
    `Briefing: ${profile.editableBrief}`,
    `Servicos: ${profile.services.join(", ")}`,
    `Regras de conteudo: ${profile.contentRules.join(" | ")}`,
    `Dia da semana: ${day}`,
    `Post no dia: ${postIndex + 1} de ${dayConfig.postsPerDay}`,
    `Horarios do dia: ${expandPostTimes(dayConfig.postTimes, dayConfig.postsPerDay).join(", ")}`,
    "",
    siblingIdeas.length > 0
      ? `Outros posts do mesmo dia para diferenciar: ${siblingIdeas.map((idea) => `slot ${idea.slot}: objetivo=${idea.goal || "nao definido"}; tipos=${idea.contentTypes.join(", ") || "nao definidos"}; formatos=${idea.formats.join(", ") || "nao definidos"}`).join(" || ")}`
      : "Nao ha outros posts definidos para este dia.",
    "",
    weeklySiblingIdeas.length > 0
      ? `Outros posts da semana para evitar duplicidade: ${weeklySiblingIdeas.map((idea) => `${idea.day} slot ${idea.slot}: objetivo=${idea.goal || "nao definido"}; tipos=${idea.contentTypes.join(", ") || "nao definidos"}; formatos=${idea.formats.join(", ") || "nao definidos"}`).join(" || ")}`
      : "Nao ha outros posts definidos na semana.",
    "",
    "Priorize clareza estrategica, variedade editorial e informacoes que ajudem outra IA a produzir um post melhor."
  ].join("\n");
  try {
    return await requestAutomaticPostIdea(prompt);
  } catch {
    return buildFallbackAutomaticPostIdea({ profile, day, postIndex, siblingIdeas });
  }
}
