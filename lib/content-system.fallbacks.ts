import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import { DAY_ORDER, type DayLabel } from "./content-system.constants.ts";
import type {
  AutomaticPostIdea,
  AutomaticSettingTarget,
  BrandProfile
} from "./content-system.schemas.ts";

function pickRotatingItems(items: string[], start: number, count: number) {
  if (items.length === 0) {
    return [];
  }
  return Array.from({ length: Math.min(count, items.length) }, (_, index) => {
    const safeIndex = (start + index) % items.length;
    return items[safeIndex];
  });
}

export function buildFallbackAutomaticPostIdea(input: {
  profile: BrandProfile;
  day: DayLabel;
  postIndex: number;
  siblingIdeas: Array<{
    slot: number;
    goal: string;
    contentTypes: string[];
    formats: string[];
  }>;
}): AutomaticPostIdea {
  const serviceFocus =
    input.profile.services[input.postIndex % input.profile.services.length] ??
    "automacao de processos";
  const savedGoal =
    input.profile.goalPresets[input.postIndex % Math.max(input.profile.goalPresets.length, 1)] ??
    "";
  const usedTerms = new Set(
    input.siblingIdeas.flatMap((idea) => [idea.goal, ...idea.contentTypes, ...idea.formats])
  );
  const contentTypeCatalog = [
    ...input.profile.contentTypePresets,
    "diagnostico pratico de gargalo operacional",
    "comparacao entre processo manual e fluxo automatizado",
    "passo a passo orientado a decisao",
    "cenario real de aplicacao no negocio",
    "checklist de implementacao sem retrabalho"
  ].filter((item) => item && !usedTerms.has(item));
  const formatCatalog = [
    ...input.profile.formatPresets,
    "Carrossel consultivo com abertura de dor, explicacao do problema, caminho pratico e fechamento com CTA",
    "Reels educativo com gancho forte, exemplo concreto e chamada para diagnostico",
    "Post estatico analitico com promessa clara, dado pratico e CTA objetivo",
    "Sequencia de stories com enquete, quebra de objecao e convite para conversa"
  ].filter((item) => item && !usedTerms.has(item));
  const contentTypes = pickRotatingItems(contentTypeCatalog, input.postIndex, 4).map((item) =>
    item.includes(" de ") || item.includes(" com ") || item.length > 28
      ? item
      : `${item} aplicado a ${serviceFocus} com foco em decisao, clareza operacional e ganho de produtividade`
  );
  const formats = pickRotatingItems(formatCatalog, input.postIndex, 3).map((item) =>
    item.length > 32
      ? item
      : `${item} com abordagem mais consultiva, exemplo realista e CTA conectado ao servico`
  );
  return {
    goal:
      savedGoal ||
      `Posicionar a ${input.profile.brandName} como referencia em ${serviceFocus}, explicando com mais profundidade como esse tema impacta a operacao do cliente e conduzindo a audiencia para um proximo passo comercial com contexto e credibilidade.`,
    contentTypes:
      contentTypes.length > 0
        ? contentTypes
        : [
            `Explicacao pratica de como ${serviceFocus} reduz retrabalho, aumenta visibilidade operacional e melhora a tomada de decisao.`,
            `Analise de erro comum ligado a ${serviceFocus}, mostrando causa, impacto e correcao recomendada.`,
            `Cenario de aplicacao real de ${serviceFocus} no contexto de empresas que vendem online e precisam escalar com controle.`
          ],
    formats:
      formats.length > 0
        ? formats
        : [
            "Carrossel educativo com contexto de dor, diagnostico, recomendacao pratica e CTA consultivo.",
            "Reels explicativo com abertura de impacto, exemplo de operacao e conclusao orientada a resultado.",
            "Stories em sequencia com pergunta inicial, desenvolvimento visual e convite final para contato."
          ]
  };
}

export function buildFallbackAutomaticSetting(input: {
  target: AutomaticSettingTarget;
  currentValue: string;
  profile: BrandProfile;
}) {
  const normalizedCurrentValue = input.currentValue.trim();
  const fallbackMap: Record<AutomaticSettingTarget, string> = {
    brandName: normalizedCurrentValue || input.profile.brandName || "Marca de tecnologia e automacao",
    editableBrief:
      normalizedCurrentValue ||
      `A ${input.profile.brandName} ajuda empresas a crescer com tecnologia aplicada, automacao de processos, integracoes e sistemas sob medida. O foco do conteudo deve ser educar, gerar autoridade e mostrar como a empresa simplifica operacoes, melhora a produtividade e apoia decisoes mais inteligentes.`,
    services:
      normalizedCurrentValue ||
      [
        "automacao de processos operacionais com foco em ganho de produtividade",
        "integracoes entre marketplaces, estoque, vendas e sistemas internos",
        "desenvolvimento de sistemas sob medida para controle e gestao",
        "dashboards e paineis gerenciais para tomada de decisao",
        "solucoes com IA para atendimento, triagem e eficiencia comercial"
      ].join("\n"),
    contentRules:
      normalizedCurrentValue ||
      [
        "Priorizar clareza, autoridade e aplicacao pratica em contexto empresarial.",
        "Explicar problemas operacionais reais antes de apresentar a solucao.",
        "Evitar temas rasos, genéricos ou sem relacao direta com o servico.",
        "Conectar cada conteudo a impacto em vendas, tempo, controle ou escala.",
        "Encerrar com CTA coerente com diagnostico, conversa ou demonstracao."
      ].join("\n"),
    researchQueries:
      normalizedCurrentValue ||
      [
        "automacao para pequenas e medias empresas",
        "integracao mercado livre estoque vendas",
        "shopee vendedores operacao e produtividade",
        "ia aplicada ao atendimento comercial",
        "sistemas para centralizar operacao de e-commerce"
      ].join("\n"),
    carouselDefaultStructure:
      normalizedCurrentValue ||
      [
        "Hook forte com dor ou oportunidade clara",
        "Contexto do problema no dia a dia da empresa",
        "Explicacao do impacto operacional ou comercial",
        "Caminho pratico ou insight aplicavel",
        "Fechamento com CTA para conversa ou diagnostico"
      ].join("\n"),
    goalPresets:
      normalizedCurrentValue ||
      [
        "Posicionar a marca como referencia confiavel em automacao aplicada a negocios.",
        "Educar o publico sobre gargalos operacionais e como resolvelos com tecnologia.",
        "Gerar demanda qualificada mostrando impacto real em produtividade e controle.",
        "Aumentar percepcao de valor com conteudos que combinam clareza, estrategia e exemplo pratico."
      ].join("\n"),
    contentTypePresets:
      normalizedCurrentValue ||
      [
        "explicacoes consultivas de processos e gargalos operacionais",
        "comparacoes entre rotina manual e fluxo automatizado",
        "diagnosticos de erro comum em operacoes digitais",
        "checklists praticos para empresas que querem ganhar escala",
        "cenarios reais de aplicacao de integracoes, IA e sistemas sob medida"
      ].join("\n"),
    formatPresets:
      normalizedCurrentValue ||
      [
        "Carrossel consultivo com contexto, diagnostico, caminho pratico e CTA",
        "Reels explicativo com abertura forte, exemplo real e fechamento objetivo",
        "Post estatico com headline estrategica, argumento central e CTA claro",
        "Sequencia de stories com pergunta inicial, desenvolvimento e convite para contato"
      ].join("\n"),
    customInstructions:
      normalizedCurrentValue ||
      `You are an expert Instagram content strategist, copywriter, and visual designer focused on ${input.profile.brandName}. Create posts that feel modern, clear, persuasive, and useful for business owners who want automation, efficiency, digital growth, and better operational control.`
  };
  return {
    value:
      input.target === "customInstructions"
        ? sanitizeCustomInstructions(fallbackMap[input.target])
        : fallbackMap[input.target]
  };
}

export function parseDayLabel(day: string) {
  return DAY_ORDER.find((entry) => entry === day) ?? DAY_ORDER[0];
}
