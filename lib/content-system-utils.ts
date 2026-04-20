import type { ContentPlanItem, TopicHistoryRecord } from "./content-system.schemas.ts";

export type TopicsHistoryCleanupFrequency = "disabled" | "daily" | "weekly" | "monthly";

const GENERIC_TOPIC_TERMS = new Set([
  "ajuda",
  "atender",
  "atendimento",
  "aumento",
  "aumentar",
  "automacao",
  "automatizar",
  "automatizacao",
  "business",
  "carrossel",
  "case",
  "cliente",
  "clientes",
  "conteudo",
  "crescer",
  "dashboard",
  "digital",
  "ecommerce",
  "empresa",
  "empresarial",
  "empresas",
  "estrategia",
  "gestao",
  "instagram",
  "inteligente",
  "inteligencia",
  "lead",
  "leads",
  "lojista",
  "lojistas",
  "marketplace",
  "marketplaces",
  "mercado",
  "negocio",
  "negocios",
  "online",
  "operacao",
  "operacional",
  "post",
  "posts",
  "previsao",
  "processo",
  "produtividade",
  "resultado",
  "resultados",
  "rotina",
  "seller",
  "shopee",
  "sistema",
  "sistemas",
  "tempo",
  "tecnologia",
  "venda",
  "vendas"
]);

const CATEGORY_RULES = [
  { category: "estoque", terms: ["estoque", "reposicao", "inventario", "sku", "ruptura"] },
  { category: "precificacao", terms: ["preco", "margem", "markup", "precificacao", "desconto"] },
  { category: "atendimento", terms: ["whatsapp", "lead", "leads", "atendimento", "suporte", "chat"] },
  { category: "marketplaces", terms: ["mercado livre", "shopee", "amazon", "magalu", "marketplace"] },
  { category: "logistica", terms: ["envio", "frete", "picking", "nota fiscal", "etiqueta", "despacho"] },
  { category: "previsao", terms: ["previsao", "demanda", "planejamento", "compra", "comprar"] },
  { category: "integracao", terms: ["integracao", "sincronizar", "hub", "centralizar", "conectar"] },
  { category: "analytics", terms: ["dashboard", "indicador", "kpi", "analise", "analitico", "relatorio"] },
  { category: "automacao", terms: ["automacao", "automatizacao", "ia", "inteligencia artificial"] }
] as const;

const ANGLE_RULES = [
  { angle: "erro-operacional", terms: ["erro", "falha", "gargalo", "caos", "perde", "perder"] },
  { angle: "ganho-eficiencia", terms: ["economia", "agilidade", "rapido", "tempo", "eficiencia", "produtividade"] },
  { angle: "passo-a-passo", terms: ["como", "passo", "guia", "checklist", "tutorial"] },
  { angle: "comparativo", terms: ["vs", "versus", "comparar", "diferenca"] },
  { angle: "previsao-planejamento", terms: ["prever", "previsao", "planejamento", "antes", "antecipar"] },
  { angle: "case-real", terms: ["case", "cliente", "historia", "resultado real"] },
  { angle: "alerta", terms: ["nunca", "erro", "cuidado", "alerta", "dor", "risco"] },
  { angle: "oportunidade", terms: ["oportunidade", "crescimento", "escala", "escalar"] }
] as const;

export function normalizeTopic(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function normalizeComparableWords(value: string) {
  return unique(
    normalizeTopic(value)
      .split(" ")
      .filter((word) => word.length >= 4 && !GENERIC_TOPIC_TERMS.has(word))
  );
}

export function getAgendaWeekKey(agenda: ContentPlanItem[]) {
  return Array.from(new Set(agenda.map((item) => item.date))).sort().join("|");
}

export function getUpcomingWeekKey(referenceDate: Date, dayLabels: readonly string[]) {
  const local = new Date(referenceDate);
  const day = local.getDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const monday = new Date(local);
  monday.setDate(local.getDate() + daysUntilNextMonday);
  monday.setHours(0, 0, 0, 0);

  return dayLabels
    .map((_, index) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + index);
      return current.toISOString().slice(0, 10);
    })
    .sort()
    .join("|");
}

export function countComparableWordOverlap(a: string, b: string) {
  const wordsA = new Set(normalizeComparableWords(a));
  const wordsB = new Set(normalizeComparableWords(b));
  let overlap = 0;

  for (const word of wordsA) {
    if (wordsB.has(word)) {
      overlap += 1;
    }
  }

  return overlap;
}

export function isSameOrSimilarTopic(candidate: string, existing: string) {
  if (!candidate || !existing) {
    return false;
  }

  const normalizedCandidate = normalizeTopic(candidate);
  const normalizedExisting = normalizeTopic(existing);
  if (
    normalizedCandidate === normalizedExisting ||
    normalizedCandidate.includes(normalizedExisting) ||
    normalizedExisting.includes(normalizedCandidate)
  ) {
    return true;
  }

  return countComparableWordOverlap(normalizedCandidate, normalizedExisting) >= 2;
}

function matchesRule(text: string, rules: readonly { category?: string; angle?: string; terms: readonly string[] }[]) {
  for (const rule of rules) {
    if (rule.terms.some((term) => text.includes(normalizeTopic(term)))) {
      return "category" in rule ? rule.category : rule.angle;
    }
  }

  return undefined;
}

export function inferThemeCategory(item: Pick<ContentPlanItem, "theme" | "topicKeywords">) {
  const combined = normalizeTopic([item.theme, ...item.topicKeywords].join(" "));
  return matchesRule(combined, CATEGORY_RULES) ?? "geral";
}

export function inferContentAngle(
  item: Pick<ContentPlanItem, "theme" | "goal" | "type" | "format" | "caption" | "topicKeywords">
) {
  const combined = normalizeTopic(
    [item.theme, item.goal, item.type, item.format, item.caption, ...item.topicKeywords].join(" ")
  );
  return matchesRule(combined, ANGLE_RULES) ?? "educacional";
}

export function getUsefulTopicKeywords(item: Pick<ContentPlanItem, "topicKeywords">) {
  return unique(
    item.topicKeywords
      .map((keyword) => normalizeTopic(keyword))
      .filter(Boolean)
      .filter((keyword) => {
        const words = normalizeComparableWords(keyword);
        return words.length >= 1 || keyword.length >= 18;
      })
  );
}

function getThemeFingerprintParts(item: Pick<ContentPlanItem, "theme" | "topicKeywords">) {
  return unique([
    ...normalizeComparableWords(item.theme).slice(0, 4),
    ...getUsefulTopicKeywords(item).flatMap((keyword) => normalizeComparableWords(keyword)).slice(0, 4)
  ]).slice(0, 6);
}

export function buildThemeFingerprint(
  item: Pick<ContentPlanItem, "theme" | "topicKeywords" | "themeCategory" | "contentAngle">
) {
  const category = normalizeTopic(item.themeCategory || "");
  const angle = normalizeTopic(item.contentAngle || "");
  const parts = getThemeFingerprintParts(item);
  return [category || "geral", angle || "educacional", parts.join("-") || normalizeTopic(item.theme)]
    .filter(Boolean)
    .join("|");
}

export function enrichContentPlanItem(item: ContentPlanItem): ContentPlanItem {
  const themeCategory = item.themeCategory?.trim() || inferThemeCategory(item);
  const contentAngle = item.contentAngle?.trim() || inferContentAngle(item);

  return {
    ...item,
    themeCategory,
    contentAngle,
    topicKeywords: getUsefulTopicKeywords(item)
  };
}

export function buildTopicsHistoryEntries(agenda: ContentPlanItem[]) {
  return unique(
    agenda
      .flatMap((rawItem) => {
        const item = enrichContentPlanItem(rawItem);
        return [item.theme, ...item.topicKeywords];
      })
      .map((entry) => normalizeTopic(entry))
      .filter(Boolean)
      .filter((entry) => {
        const words = normalizeComparableWords(entry);
        return words.length >= 1 || entry.length >= 18;
      })
  );
}

export function buildTopicHistoryRecords(agenda: ContentPlanItem[], createdAt = new Date().toISOString()) {
  return agenda.map((rawItem) => {
    const item = enrichContentPlanItem(rawItem);
    return {
      theme: item.theme,
      normalizedTheme: normalizeTopic(item.theme),
      themeCategory: item.themeCategory,
      contentAngle: item.contentAngle,
      keywords: getUsefulTopicKeywords(item),
      fingerprint: buildThemeFingerprint(item),
      createdAt
    } satisfies TopicHistoryRecord;
  });
}

export function normalizeTopicHistoryRecord(
  entry: string | Partial<TopicHistoryRecord>
) {
  if (typeof entry === "string") {
    const normalizedTheme = normalizeTopic(entry);
    if (!normalizedTheme) {
      return null;
    }

    const syntheticItem: ContentPlanItem = {
      date: "1970-01-01",
      day: "Segunda",
      time: "09:00",
      goal: "",
      type: "",
      format: "",
      theme: entry,
      structure: ["Tema", "Contexto", "CTA"],
      caption: "",
      visualIdea: "",
      cta: "",
      topicKeywords: [entry]
    };
    const enriched = enrichContentPlanItem(syntheticItem);

    return {
      theme: entry,
      normalizedTheme,
      themeCategory: enriched.themeCategory,
      contentAngle: enriched.contentAngle,
      keywords: getUsefulTopicKeywords(enriched),
      fingerprint: buildThemeFingerprint(enriched)
    } satisfies TopicHistoryRecord;
  }

  const theme = String(entry.theme ?? "").trim();
  const normalizedTheme = normalizeTopic(String(entry.normalizedTheme ?? theme));
  if (!theme || !normalizedTheme) {
    return null;
  }

  const keywords = Array.isArray(entry.keywords)
    ? unique(entry.keywords.map((keyword) => normalizeTopic(String(keyword))).filter(Boolean))
    : [];

  return {
    theme,
    normalizedTheme,
    themeCategory: entry.themeCategory?.trim() || undefined,
    contentAngle: entry.contentAngle?.trim() || undefined,
    keywords,
    fingerprint:
      String(entry.fingerprint ?? "").trim() ||
      buildThemeFingerprint({
        theme,
        topicKeywords: keywords,
        themeCategory: entry.themeCategory?.trim() || undefined,
        contentAngle: entry.contentAngle?.trim() || undefined
      }),
    createdAt: entry.createdAt
  } satisfies TopicHistoryRecord;
}

export function shouldBlockForInternalDuplicate(
  candidate: ContentPlanItem,
  acceptedAgenda: ContentPlanItem[],
  rigor: "strict" | "balanced" | "flexible"
) {
  const item = enrichContentPlanItem(candidate);
  const sameCategoryThreshold: Record<typeof rigor, number> = {
    strict: 1,
    balanced: 2,
    flexible: 3
  };

  return acceptedAgenda.some((acceptedRaw) => {
    const accepted = enrichContentPlanItem(acceptedRaw);
    const sameTheme = isSameOrSimilarTopic(item.theme, accepted.theme);
    const sameFingerprint = buildThemeFingerprint(item) === buildThemeFingerprint(accepted);
    const sameCategory = item.themeCategory === accepted.themeCategory;
    const sameAngle = item.contentAngle === accepted.contentAngle;
    const overlap = countComparableWordOverlap(item.theme, accepted.theme);
    const keywordOverlap = item.topicKeywords.some((keyword) =>
      accepted.topicKeywords.some((acceptedKeyword) => isSameOrSimilarTopic(keyword, acceptedKeyword))
    );

    if (sameTheme || sameFingerprint) {
      return true;
    }

    if (sameCategory && sameAngle && (overlap >= 1 || keywordOverlap)) {
      return true;
    }

    return sameCategory && overlap >= sameCategoryThreshold[rigor];
  });
}

export function shouldBlockForHistoryDuplicate(
  candidate: ContentPlanItem,
  history: TopicHistoryRecord[],
  options?: {
    allowAngleVariationAfterAttempt?: boolean;
  }
) {
  const item = enrichContentPlanItem(candidate);
  const candidateFingerprint = buildThemeFingerprint(item);

  return history.some((entry) => {
    const sameTheme = isSameOrSimilarTopic(item.theme, entry.normalizedTheme);
    const sameFingerprint = candidateFingerprint === entry.fingerprint;
    const sameCategory = item.themeCategory === entry.themeCategory;
    const sameAngle = item.contentAngle === entry.contentAngle;
    const keywordOverlap = item.topicKeywords.some((keyword) =>
      entry.keywords.some((historyKeyword) => isSameOrSimilarTopic(keyword, historyKeyword))
    );
    const overlap = countComparableWordOverlap(item.theme, entry.normalizedTheme);

    if (sameTheme || sameFingerprint) {
      return true;
    }

    if (sameCategory && sameAngle && (keywordOverlap || overlap >= 1)) {
      return true;
    }

    if (options?.allowAngleVariationAfterAttempt) {
      return false;
    }

    return sameCategory && overlap >= 2 && keywordOverlap;
  });
}

export function shouldSkipAutomationLoop(
  currentAgenda: ContentPlanItem[],
  referenceDate: Date,
  dayLabels: readonly string[]
) {
  return (
    currentAgenda.length > 0 &&
    getAgendaWeekKey(currentAgenda) === getUpcomingWeekKey(referenceDate, dayLabels)
  );
}

export function shouldRunTopicsHistoryCleanup(
  frequency: TopicsHistoryCleanupFrequency,
  referenceDate: Date
) {
  if (frequency === "disabled") {
    return false;
  }

  if (frequency === "daily") {
    return true;
  }

  if (frequency === "weekly") {
    return referenceDate.getDay() === 0;
  }

  return referenceDate.getDate() === 1;
}
