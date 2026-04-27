import {
  throwIfGenerationCancelled
} from "@/lib/content-system.generation-progress";
import {
  buildTopicHistoryRecords,
  buildTopicsHistoryEntries,
  enrichContentPlanItem,
  shouldBlockForHistoryDuplicate,
  shouldBlockForInternalDuplicate
} from "@/lib/content-system-utils";
import { requestWeeklyAgenda } from "./content-system.requests.ts";
import { buildWeekSlots, getDayConfig, type WeekSlot } from "./content-system.schedule.ts";
import type { BrandProfile, TopicHistoryRecord } from "./content-system.schemas.ts";
import {
  getBrandProfile,
  getContentHistory,
  getTopicsHistoryRecords,
  saveCurrentTopics,
  saveWeeklyContentResult
} from "./content-system.storage.ts";

const MAX_WEEKLY_AGENDA_ATTEMPTS = 5;
const MAX_REJECTED_THEMES_IN_PROMPT = 24;
const MAX_TOPIC_HISTORY_RECORDS = 300;

function extractGoogleNewsTitles(xml: string) {
  return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
    .map((match) => match[1])
    .filter((title) => title && title !== "Google News")
    .slice(0, 5);
}

async function fetchCurrentTopics(queries: string[], userId?: string) {
  const topics = new Set<string>();
  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      for (const title of extractGoogleNewsTitles(await response.text())) {
        topics.add(title);
      }
    } catch {
      continue;
    }
  }
  const topicList = Array.from(topics).slice(0, 20);
  await saveCurrentTopics(topicList, userId);
  return topicList;
}

function buildWeeklyPrompt(input: {
  brandProfile: BrandProfile;
  weekSlots: WeekSlot[];
  currentTopics: string[];
  recentTopics: string[];
  rejectedThemes?: string[];
}) {
  const weeklyAgenda = input.weekSlots
    .map((slot) => {
      const config = getDayConfig(input.brandProfile, slot.label);
      return [
        `Dia: ${slot.label} (${slot.date})`,
        `Horario: ${slot.time}`,
        `Postagem: ${slot.slotIndex} de ${slot.postsPerDay}`,
        `Objetivo: ${slot.goal}`,
        `Tipos: ${slot.contentTypes.join(", ")}`,
        `Formatos: ${slot.formats.join(", ")}`
      ].join("\n");
    })
    .join("\n\n");

  return [
    "Você é um agente especialista em marketing digital, social media e automação de conteúdo.",
    "Seu objetivo é gerar automaticamente conteúdos para Instagram para a janela de 7 dias solicitada.",
    "Retorne somente JSON válido, sem markdown, com um array chamado week.",
    "Cada item de week deve conter: date, day, time, goal, type, format, theme, themeCategory, contentAngle, structure, caption, visualIdea, cta, topicKeywords.",
    "As strings devem vir em português do Brasil.",
    "A estrutura deve seguir o cronograma semanal da marca e a ordem exata dos slots informados.",
    "Se houver mais de um post no mesmo dia, cada item precisa ter um tema claramente diferente dos demais daquele dia.",
    "Evite repetir temas dos últimos 60 dias e também evite assuntos muito semelhantes.",
    "ThemeCategory deve ser uma categoria curta como estoque, precificacao, marketplaces, atendimento, logistica, previsao, integracao ou analytics.",
    "ContentAngle deve ser um angulo claro como erro-operacional, ganho-eficiencia, passo-a-passo, comparativo, previsao-planejamento, case-real, alerta ou oportunidade.",
    "Você pode repetir a categoria ao longo das semanas, mas não pode repetir a mesma categoria com o mesmo angulo nesta semana.",
    "Use topicKeywords como assuntos específicos e reutilizáveis para o histórico anti-repetição. Evite keywords genéricas como ia, automacao, ecommerce e marketplace.",
    "Priorize temas atuais ligados a automação, e-commerce, Mercado Livre, Shopee, IA aplicada a negócios e produtividade empresarial.",
    "",
    `Marca: ${input.brandProfile.brandName}`,
    `Brief editável: ${input.brandProfile.editableBrief}`,
    `Serviços: ${input.brandProfile.services.join(", ")}`,
    `Estrutura padrão de carrossel: ${input.brandProfile.carouselDefaultStructure.join(" -> ")}`,
    `Regras: ${input.brandProfile.contentRules.join(" | ")}`,
    "",
    "Agenda semanal obrigatória:",
    weeklyAgenda,
    "",
    `Temas atuais encontrados: ${input.currentTopics.join(" | ") || "Nenhum tema atual encontrado."}`,
    `Assuntos recentes a evitar: ${input.recentTopics.join(" | ") || "Nenhum."}`,
    `Temas rejeitados nesta tentativa por repetição: ${input.rejectedThemes?.join(" | ") || "Nenhum."}`,
    "",
    "Saída esperada por item:",
    "- theme: tema do post",
    "- themeCategory: categoria curta do tema",
    "- contentAngle: angulo editorial do tema",
    "- type: tipo de conteúdo",
    "- format: formato sugerido",
    "- structure: ARRAY JSON com 3+ seções/slides",
    "- caption: legenda completa",
    "- visualIdea: ideia visual do post",
    "- cta: chamada para ação",
    "- topicKeywords: ARRAY JSON com 3-6 palavras-chave específicas",
    "- IMPORTANTE: structure e topicKeywords DEVEM ser arrays JSON, não strings!",
    "",
    "Regras críticas:",
    "- nao repita o mesmo tema em mais de um slot da semana",
    "- se repetir categoria, mude claramente o angulo",
    "- nao reutilize nenhum item listado como assunto recente a evitar",
    "- nao reutilize nenhum tema listado como rejeitado nesta tentativa"
  ].join("\n");
}

function buildAgendaWithWeekSlots(
  generatedAgenda: Awaited<ReturnType<typeof requestWeeklyAgenda>>,
  weekSlots: WeekSlot[]
) {
  return generatedAgenda.map((item, index) =>
    enrichContentPlanItem({
      ...item,
      date: weekSlots[index]?.date ?? item.date,
      day: weekSlots[index]?.label ?? item.day,
      time: weekSlots[index]?.time ?? item.time
    })
  );
}

function mergeTopicHistoryRecords(
  existingRecords: TopicHistoryRecord[],
  newRecords: TopicHistoryRecord[]
) {
  const merged = new Map<string, TopicHistoryRecord>();

  for (const record of [...existingRecords, ...newRecords]) {
    merged.set(record.fingerprint, record);
  }

  return Array.from(merged.values()).slice(-MAX_TOPIC_HISTORY_RECORDS);
}

function buildRecentHistoryWindow(
  topicHistoryRecords: TopicHistoryRecord[],
  historyLookbackDays: number,
  attempt: number
) {
  const baseLookback = Math.ceil((historyLookbackDays || 60) * 7 / 30);
  const historyWindow = Math.max(
    Math.ceil(baseLookback * (1 - (attempt - 1) * 0.2)),
    7
  );

  return {
    historyWindow,
    recentHistory: topicHistoryRecords.slice(-historyWindow)
  };
}

function performDeduplication(
  agenda: ReturnType<typeof buildAgendaWithWeekSlots>,
  history: TopicHistoryRecord[],
  rigor: "strict" | "balanced" | "flexible",
  attempt: number
) {
  const acceptedAgenda: ReturnType<typeof buildAgendaWithWeekSlots> = [];
  const rejectedThemes = new Set<string>();
  const allowAngleVariationAfterAttempt = attempt >= 3;

  for (const item of agenda) {
    const hasInternalDuplicate = shouldBlockForInternalDuplicate(item, acceptedAgenda, rigor);
    const collidesWithHistory = shouldBlockForHistoryDuplicate(item, history, {
      allowAngleVariationAfterAttempt
    });

    if (hasInternalDuplicate || collidesWithHistory) {
      rejectedThemes.add(item.theme);
      rejectedThemes.add(`${item.themeCategory}: ${item.contentAngle}`);
      item.topicKeywords.forEach((keyword) => rejectedThemes.add(keyword));
      continue;
    }

    acceptedAgenda.push(item);
  }

  return {
    dedupedAgenda: acceptedAgenda,
    rejectedThemes: Array.from(rejectedThemes)
  };
}

export async function generateWeeklyContentPlan(
  referenceDate = new Date(),
  options?: {
    windowMode?: "next-week" | "rolling-7d";
    userId?: string;
  }
) {
  if (options?.userId) {
    throwIfGenerationCancelled(options.userId);
  }
  const brandProfile = await getBrandProfile(options?.userId);
  const weekSlots = buildWeekSlots(brandProfile, referenceDate, {
    windowMode: options?.windowMode
  });
  if (weekSlots.length === 0) {
    throw new Error("At least one active day with a valid post schedule is required.");
  }

  const contentHistory = await getContentHistory(options?.userId);
  const topicHistoryRecords = await getTopicsHistoryRecords(options?.userId);
  const currentTopics = await fetchCurrentTopics(brandProfile.researchQueries, options?.userId);
  let dedupedAgenda: ReturnType<typeof buildAgendaWithWeekSlots> | null = null;
  let rejectedThemes: string[] = [];

  for (let attempt = 1; attempt <= MAX_WEEKLY_AGENDA_ATTEMPTS; attempt += 1) {
    if (options?.userId) {
      throwIfGenerationCancelled(options.userId);
    }
    const { historyWindow, recentHistory } = buildRecentHistoryWindow(
      topicHistoryRecords,
      brandProfile.historyLookbackDays || 60,
      attempt
    );
    const recentTopics = recentHistory.map((entry) => entry.theme);

    const generatedAgenda = await requestWeeklyAgenda(
      buildWeeklyPrompt({
        brandProfile,
        weekSlots,
        currentTopics,
        recentTopics,
        rejectedThemes: rejectedThemes.slice(-MAX_REJECTED_THEMES_IN_PROMPT)
      }),
      weekSlots.length
    );
    if (options?.userId) {
      throwIfGenerationCancelled(options.userId);
    }

    const agenda = buildAgendaWithWeekSlots(generatedAgenda, weekSlots);
    const dedupeResult = performDeduplication(
      agenda,
      recentHistory,
      brandProfile.generationRigor || "balanced",
      attempt
    );

    if (dedupeResult.dedupedAgenda.length === agenda.length) {
      dedupedAgenda = dedupeResult.dedupedAgenda;
      break;
    }

    rejectedThemes = Array.from(new Set([...rejectedThemes, ...dedupeResult.rejectedThemes]));
    console.warn("[content-system] Weekly agenda attempt rejected due to repeated themes", {
      attempt,
      topicsWindow: historyWindow,
      totalRejected: rejectedThemes.length
    });
  }

  if (!dedupedAgenda) {
    throw new Error(
      `Weekly agenda generation failed after ${MAX_WEEKLY_AGENDA_ATTEMPTS} attempts. ` +
      `Try reducing repeated rules, lowering the history lookback window, or clearing old topic history so the planner has room to create new angles.`
    );
  }

  const nextContentHistory = [
    ...contentHistory,
    ...dedupedAgenda.map((item) => ({ date: item.date, day: item.day, theme: item.theme }))
  ];

  const newTopicHistory = buildTopicHistoryRecords(dedupedAgenda);
  const nextTopicHistoryRecords = mergeTopicHistoryRecords(topicHistoryRecords, newTopicHistory);
  await saveWeeklyContentResult({
    userId: options?.userId,
    agenda: dedupedAgenda,
    contentHistory: nextContentHistory,
    topicHistoryRecords: nextTopicHistoryRecords,
    currentTopics
  });

  return {
    agenda: dedupedAgenda,
    currentTopics,
    brandProfile,
    topicsHistory: buildTopicsHistoryEntries(dedupedAgenda)
  };
}
