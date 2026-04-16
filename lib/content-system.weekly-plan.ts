import {
  buildTopicsHistoryEntries,
  isSameOrSimilarTopic,
  normalizeTopic
} from "@/lib/content-system-utils";
import {
  AGENDA_PATH,
  CONTENT_HISTORY_PATH,
  TOPICS_HISTORY_PATH,
  TOPICS_PATH
} from "./content-system.constants.ts";
import { requestWeeklyAgenda } from "./content-system.requests.ts";
import { buildWeekSlots, getDayConfig, type WeekSlot } from "./content-system.schedule.ts";
import type { BrandProfile } from "./content-system.schemas.ts";
import {
  getBrandProfile,
  getContentHistory,
  getTopicsHistory,
  writeJsonFile
} from "./content-system.storage.ts";

const MAX_WEEKLY_AGENDA_ATTEMPTS = 5;

function extractGoogleNewsTitles(xml: string) {
  return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
    .map((match) => match[1])
    .filter((title) => title && title !== "Google News")
    .slice(0, 5);
}

async function fetchCurrentTopics(queries: string[]) {
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
  await writeJsonFile(TOPICS_PATH, topicList);
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
    "Cada item de week deve conter: date, day, time, goal, type, format, theme, structure, caption, visualIdea, cta, topicKeywords.",
    "As strings devem vir em português do Brasil.",
    "A estrutura deve seguir o cronograma semanal da marca e a ordem exata dos slots informados.",
    "Se houver mais de um post no mesmo dia, cada item precisa ter um tema claramente diferente dos demais daquele dia.",
    "Evite repetir temas dos últimos 60 dias e também evite assuntos muito semelhantes.",
    "Use topicKeywords como assuntos curtos e reutilizáveis para o histórico anti-repetição.",
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
    `Temas rejeitados nesta tentativa por repeticao: ${input.rejectedThemes?.join(" | ") || "Nenhum."}`,
    "",
    "Saída esperada por item:",
    "- theme: tema do post",
    "- type: tipo de conteúdo",
    "- format: formato sugerido",
    "- structure: ARRAY JSON com 3+ seções/slides (ex: [\"Capa\", \"Exemplo\", \"CTA\"])",
    "- caption: legenda completa",
    "- visualIdea: ideia visual do post",
    "- cta: chamada para ação",
    "- topicKeywords: ARRAY JSON com 3-6 palavras-chave (ex: [\"automacao\", \"ecommerce\", \"ia\"])",
    "- IMPORTANTE: structure e topicKeywords DEVEM ser arrays JSON, não strings!",
    "",
    "Regras críticas:",
    "- nao repita o mesmo tema em mais de um slot da semana",
    "- se houver dois slots parecidos, force angulos claramente diferentes",
    "- nao reutilize nenhum item listado como assunto recente a evitar",
    "- nao reutilize nenhum tema listado como rejeitado nesta tentativa"
  ].join("\n");
}

function buildAgendaWithWeekSlots(generatedAgenda: Awaited<ReturnType<typeof requestWeeklyAgenda>>, weekSlots: WeekSlot[]) {
  return generatedAgenda.map((item, index) => ({
    ...item,
    date: weekSlots[index]?.date ?? item.date,
    day: weekSlots[index]?.label ?? item.day,
    time: weekSlots[index]?.time ?? item.time
  }));
}

function dedupeAgendaAgainstHistory(
  agenda: ReturnType<typeof buildAgendaWithWeekSlots>,
  topicsHistory: string[]
) {
  const normalizedTopicHistory = topicsHistory.map(normalizeTopic).filter(Boolean);
  return performDeduplication(agenda, normalizedTopicHistory, "balanced");
}

function performDeduplication(
  agenda: ReturnType<typeof buildAgendaWithWeekSlots>,
  topicsHistory: string[],
  rigor: "strict" | "balanced" | "flexible"
) {
  const generatedTopics = new Set<string>();
  const rejectedThemes = new Set<string>();
  const hasHistory = topicsHistory.length > 0;
  
  const thresholds: Record<typeof rigor, number> = {
    strict: 2,
    balanced: hasHistory ? 2 : 3,
    flexible: 4
  };
  const similarityThreshold = thresholds[rigor];

  const dedupedAgenda = agenda.filter((item) => {
    const normalizedTheme = normalizeTopic(item.theme);
    const normalizedEntries = buildTopicsHistoryEntries([item]);
    
    const hasInternalDuplicate = Array.from(generatedTopics).some((entry) => {
      const overlap = calculateWordOverlap(normalizedTheme, entry);
      return overlap >= similarityThreshold;
    }) ||
    Array.from(generatedTopics).some((entry) =>
      normalizedEntries.some((topic) => {
        const overlap = calculateWordOverlap(topic, entry);
        return overlap >= similarityThreshold;
      })
    );

    if (hasInternalDuplicate) {
      rejectedThemes.add(item.theme);
      normalizedEntries.forEach((entry) => rejectedThemes.add(entry));
      return false;
    }

    // Verificação contra histórico
    const collidesWithHistory = topicsHistory.some(
      (historyEntry) =>
        isSameOrSimilarTopic(normalizedTheme, historyEntry) ||
        normalizedEntries.some((entry) => isSameOrSimilarTopic(entry, historyEntry))
    );

    if (collidesWithHistory) {
      rejectedThemes.add(item.theme);
      normalizedEntries.forEach((entry) => rejectedThemes.add(entry));
      return false;
    }

    generatedTopics.add(normalizedTheme);
    normalizedEntries.forEach((entry) => generatedTopics.add(entry));
    return true;
  });

  return {
    dedupedAgenda,
    rejectedThemes: Array.from(rejectedThemes)
  };
}

function calculateWordOverlap(str1: string, str2: string): number {
  const words1 = new Set(str1.split(" ").filter((word) => word.length >= 4));
  const words2 = new Set(str2.split(" ").filter((word) => word.length >= 4));
  let overlap = 0;

  for (const word of words1) {
    if (words2.has(word)) {
      overlap += 1;
    }
  }

  return overlap;
}

export async function generateWeeklyContentPlan(
  referenceDate = new Date(),
  options?: {
    windowMode?: "next-week" | "rolling-7d";
  }
) {
  const brandProfile = await getBrandProfile();
  const weekSlots = buildWeekSlots(brandProfile, referenceDate, {
    windowMode: options?.windowMode
  });
  if (weekSlots.length === 0) {
    throw new Error("At least one active day with a valid post schedule is required.");
  }
  const contentHistory = await getContentHistory();
  const topicsHistory = await getTopicsHistory();
  const currentTopics = await fetchCurrentTopics(brandProfile.researchQueries);
  let dedupedAgenda: ReturnType<typeof buildAgendaWithWeekSlots> | null = null;
  let rejectedThemes: string[] = [];

  for (let attempt = 1; attempt <= MAX_WEEKLY_AGENDA_ATTEMPTS; attempt += 1) {
    // Calcular janela de histórico baseado em configuração do usuário e tentativa
    const baseLookback = Math.ceil((brandProfile.historyLookbackDays || 60) * 7 / 30);
    const recentTopicsWindow = Math.max(
      Math.ceil(baseLookback * (1 - (attempt - 1) * 0.2)),
      7
    );

    const generatedAgenda = await requestWeeklyAgenda(
      buildWeeklyPrompt({
        brandProfile,
        weekSlots,
        currentTopics,
        recentTopics: topicsHistory.slice(-recentTopicsWindow),
        rejectedThemes
      }),
      weekSlots.length
    );
    const agenda = buildAgendaWithWeekSlots(generatedAgenda, weekSlots);
    const dedupeResult = performDeduplication(agenda, topicsHistory, brandProfile.generationRigor || "balanced");

    if (dedupeResult.dedupedAgenda.length === agenda.length) {
      dedupedAgenda = dedupeResult.dedupedAgenda;
      break;
    }

    rejectedThemes = Array.from(new Set([...rejectedThemes, ...dedupeResult.rejectedThemes]));
    console.warn("[content-system] Weekly agenda attempt rejected due to repeated themes", {
      attempt,
      topicsWindow: recentTopicsWindow,
      totalRejected: rejectedThemes.length
    });
  }

  if (!dedupedAgenda) {
    throw new Error(`Weekly agenda generation failed after ${MAX_WEEKLY_AGENDA_ATTEMPTS} attempts. Your brand might have overlapping topics. Try clearing the topics history or adjusting content rules.`);
  }

  await writeJsonFile(AGENDA_PATH, dedupedAgenda);
  await writeJsonFile(CONTENT_HISTORY_PATH, [
    ...contentHistory,
    ...dedupedAgenda.map((item) => ({ date: item.date, day: item.day, theme: item.theme }))
  ]);
  await writeJsonFile(
    TOPICS_HISTORY_PATH,
    Array.from(
      new Set([...topicsHistory.map(normalizeTopic), ...buildTopicsHistoryEntries(dedupedAgenda)])
    ).slice(-300)
  );
  return { agenda: dedupedAgenda, currentTopics, brandProfile };
}
