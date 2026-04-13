import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import { buildFallbackAutomaticSetting } from "./content-system.fallbacks.ts";
import {
  requestAutomaticSetting,
  requestAutomaticSettingsBundle
} from "./content-system.requests.ts";
import {
  automaticSettingTargetSchema,
  brandProfileSchema,
  type AutomaticSettingTarget
} from "./content-system.schemas.ts";

const LIST_TARGETS = new Set([
  "services",
  "contentRules",
  "researchQueries",
  "carouselDefaultStructure",
  "goalPresets",
  "contentTypePresets",
  "formatPresets"
]);

const FIELD_INSTRUCTIONS: Record<AutomaticSettingTarget, string> = {
  brandName:
    "Retorne um nome curto e forte, sem explicacoes extras. Preserve a identidade principal do nome atual, mas refine se fizer sentido.",
  editableBrief:
    "Retorne um briefing mais elaborado, mantendo a mesma proposta central, em um paragrafo mais estrategico e util para IA.",
  services:
    "Retorne uma lista com 4 a 6 linhas, cada uma com um servico mais claro, especifico e orientado a resultado.",
  contentRules: "Retorne uma lista com 4 a 6 linhas de regras editoriais claras e acionaveis.",
  researchQueries:
    "Retorne uma lista com 4 a 6 consultas de pesquisa mais especificas para descobrir temas atuais e relevantes.",
  carouselDefaultStructure:
    "Retorne uma lista com 4 a 6 etapas de estrutura para carrossel, mais claras e estrategicas.",
  goalPresets: "Retorne uma lista com 4 a 6 presets de objetivo mais elaborados e estrategicos.",
  contentTypePresets:
    "Retorne uma lista com 4 a 6 presets de tipos de conteudo mais especificos e ricos.",
  formatPresets:
    "Retorne uma lista com 4 a 6 presets de formatos mais detalhados e acionaveis.",
  customInstructions:
    "Retorne uma formula de prompt completa em ingles, mantendo a intencao atual, mas com mais contexto, clareza e direcionamento."
};

function buildTargetDependencies(target: AutomaticSettingTarget) {
  const dependencies: Record<AutomaticSettingTarget, AutomaticSettingTarget[]> = {
    brandName: ["editableBrief", "services", "contentRules"],
    editableBrief: ["brandName", "services", "contentRules", "researchQueries"],
    services: ["brandName", "editableBrief", "contentRules"],
    contentRules: ["brandName", "editableBrief", "services", "researchQueries"],
    researchQueries: ["brandName", "editableBrief", "services", "contentRules"],
    carouselDefaultStructure: ["brandName", "editableBrief", "contentRules", "formatPresets"],
    goalPresets: ["brandName", "editableBrief", "services", "contentRules"],
    contentTypePresets: ["brandName", "editableBrief", "services", "goalPresets"],
    formatPresets: ["brandName", "editableBrief", "contentRules", "carouselDefaultStructure"],
    customInstructions: [
      "brandName",
      "editableBrief",
      "services",
      "contentRules",
      "researchQueries",
      "carouselDefaultStructure",
      "goalPresets",
      "contentTypePresets",
      "formatPresets"
    ]
  };
  return dependencies[target];
}

function getDependencyValues(profile: ReturnType<typeof brandProfileSchema.parse>, currentValue: string) {
  return {
    brandName: profile.brandName,
    editableBrief: profile.editableBrief,
    services: profile.services.join("\n"),
    contentRules: profile.contentRules.join("\n"),
    researchQueries: profile.researchQueries.join("\n"),
    carouselDefaultStructure: profile.carouselDefaultStructure.join("\n"),
    goalPresets: (profile.goalPresets ?? []).join("\n"),
    contentTypePresets: (profile.contentTypePresets ?? []).join("\n"),
    formatPresets: (profile.formatPresets ?? []).join("\n"),
    customInstructions: currentValue
  } satisfies Record<AutomaticSettingTarget, string>;
}

export async function generateAutomaticSetting(input: {
  profile: unknown;
  target: string;
  currentValue: string;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const target = automaticSettingTargetSchema.parse(input.target);
  const currentValue = input.currentValue;
  const dependencyValues = getDependencyValues(profile, currentValue);
  const prioritizedDependencies = buildTargetDependencies(target)
    .map((dependency) => `${dependency}: ${dependencyValues[dependency] || "(vazio)"}`)
    .join("\n");
  const prompt = [
    "Reescreva ou expanda uma configuracao editorial de Instagram usando o valor atual como base.",
    "Nao descarte o sentido do texto atual. Preserve a intencao principal e melhore a clareza, especificidade e profundidade.",
    "Os campos prioritarios listados abaixo devem ter mais peso do que os demais no resultado final.",
    "Retorne somente JSON valido com a chave value.",
    FIELD_INSTRUCTIONS[target],
    LIST_TARGETS.has(target)
      ? "Para listas, use quebra de linha entre os itens e nao use numeracao."
      : "Retorne somente o texto final do campo.",
    "",
    `Campo a gerar: ${target}`,
    `Valor atual do campo: ${currentValue || "(vazio)"}`,
    "Campos prioritarios para coerencia:",
    prioritizedDependencies,
    "",
    `Marca: ${profile.brandName}`,
    `Briefing atual: ${profile.editableBrief}`,
    `Servicos atuais: ${profile.services.join(" | ")}`,
    `Regras atuais: ${profile.contentRules.join(" | ")}`,
    `Consultas atuais: ${profile.researchQueries.join(" | ")}`,
    `Estrutura de carrossel atual: ${profile.carouselDefaultStructure.join(" | ")}`,
    `Presets de objetivo atuais: ${(profile.goalPresets ?? []).join(" | ")}`,
    `Presets de tipos atuais: ${(profile.contentTypePresets ?? []).join(" | ")}`,
    `Presets de formatos atuais: ${(profile.formatPresets ?? []).join(" | ")}`
  ].join("\n");
  try {
    return await requestAutomaticSetting(prompt);
  } catch {
    return buildFallbackAutomaticSetting({ target, currentValue, profile });
  }
}

export async function generateAutomaticSettingsBundle(input: {
  profile: unknown;
  customInstructions: string;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const customInstructions = sanitizeCustomInstructions(input.customInstructions);
  const prompt = [
    "Recalibre toda a configuracao editorial de uma marca para Instagram mantendo o mesmo posicionamento central.",
    "Todos os campos devem ser coerentes entre si e se apoiar mutuamente.",
    "Use o estado atual como base. Melhore clareza, especificidade, profundidade e consistencia sem perder a intencao da configuracao existente.",
    "Retorne somente JSON valido com estas chaves: brandName, editableBrief, services, contentRules, researchQueries, carouselDefaultStructure, goalPresets, contentTypePresets, formatPresets, customInstructions.",
    "Para campos de lista, use quebra de linha entre itens e nao use numeracao.",
    "A ordem de dependencia deve ser: brandName -> editableBrief -> services/contentRules/researchQueries -> carouselDefaultStructure -> goalPresets/contentTypePresets/formatPresets -> customInstructions.",
    "",
    `brandName atual: ${profile.brandName}`,
    `editableBrief atual: ${profile.editableBrief}`,
    `services atuais: ${profile.services.join("\n")}`,
    `contentRules atuais: ${profile.contentRules.join("\n")}`,
    `researchQueries atuais: ${profile.researchQueries.join("\n")}`,
    `carouselDefaultStructure atual: ${profile.carouselDefaultStructure.join("\n")}`,
    `goalPresets atuais: ${(profile.goalPresets ?? []).join("\n")}`,
    `contentTypePresets atuais: ${(profile.contentTypePresets ?? []).join("\n")}`,
    `formatPresets atuais: ${(profile.formatPresets ?? []).join("\n")}`,
    `customInstructions atual: ${customInstructions}`
  ].join("\n");
  try {
    return await requestAutomaticSettingsBundle(prompt);
  } catch {
    const fieldValue = (target: AutomaticSettingTarget, value: string) =>
      buildFallbackAutomaticSetting({ target, currentValue: value, profile }).value;
    return {
      brandName: fieldValue("brandName", profile.brandName),
      editableBrief: fieldValue("editableBrief", profile.editableBrief),
      services: fieldValue("services", profile.services.join("\n")),
      contentRules: fieldValue("contentRules", profile.contentRules.join("\n")),
      researchQueries: fieldValue("researchQueries", profile.researchQueries.join("\n")),
      carouselDefaultStructure: fieldValue(
        "carouselDefaultStructure",
        profile.carouselDefaultStructure.join("\n")
      ),
      goalPresets: fieldValue("goalPresets", (profile.goalPresets ?? []).join("\n")),
      contentTypePresets: fieldValue(
        "contentTypePresets",
        (profile.contentTypePresets ?? []).join("\n")
      ),
      formatPresets: fieldValue("formatPresets", (profile.formatPresets ?? []).join("\n")),
      customInstructions: fieldValue("customInstructions", customInstructions)
    };
  }
}
