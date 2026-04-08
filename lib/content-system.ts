import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  buildTopicsHistoryEntries,
  getAgendaWeekKey,
  getUpcomingWeekKey,
  isSameOrSimilarTopic,
  normalizeTopic,
  shouldSkipAutomationLoop
} from "@/lib/content-system-utils";
import { requireEnv } from "@/lib/env";

const contentPlanItemSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  goal: z.string().min(1),
  type: z.string().min(1),
  format: z.string().min(1),
  theme: z.string().min(1),
  structure: z.array(z.string().min(1)).min(3),
  caption: z.string().min(1),
  visualIdea: z.string().min(1),
  cta: z.string().min(1),
  topicKeywords: z.array(z.string().min(1)).min(1)
});

const weeklyAgendaSchema = z.array(contentPlanItemSchema).length(5);

const brandProfileSchema = z.object({
  brandName: z.string().min(1),
  editableBrief: z.string().min(1),
  automationLoopEnabled: z.boolean().default(true),
  services: z.array(z.string().min(1)).min(1),
  weeklyAgenda: z.record(
    z.object({
      goal: z.string().min(1),
      contentTypes: z.array(z.string().min(1)).min(1),
      formats: z.array(z.string().min(1)).min(1)
    })
  ),
  carouselDefaultStructure: z.array(z.string().min(1)).min(1),
  contentRules: z.array(z.string().min(1)).min(1),
  researchQueries: z.array(z.string().min(1)).min(1)
});

const historyItemSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  theme: z.string().min(1)
});

export type ContentPlanItem = z.infer<typeof contentPlanItemSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
type HistoryItem = z.infer<typeof historyItemSchema>;

const CONTENT_SYSTEM_DIR = path.join(process.cwd(), "content-system");
const AGENDA_PATH = path.join(CONTENT_SYSTEM_DIR, "agenda.json");
const CONTENT_HISTORY_PATH = path.join(CONTENT_SYSTEM_DIR, "content_history.json");
const TOPICS_HISTORY_PATH = path.join(CONTENT_SYSTEM_DIR, "topics_history.json");
const TOPICS_PATH = path.join(CONTENT_SYSTEM_DIR, "topics.json");
const BRAND_PROFILE_PATH = path.join(CONTENT_SYSTEM_DIR, "brand_profile.json");
const DAY_ORDER = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"] as const;
const DEFAULT_OLLAMA_TIMEOUT_MS = 480_000;

async function ensureContentSystemDir() {
  await mkdir(CONTENT_SYSTEM_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await ensureContentSystemDir();
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function getBrandProfile() {
  const raw = await readJsonFile<unknown>(BRAND_PROFILE_PATH, {});
  return brandProfileSchema.parse(raw);
}

export async function getContentBrandProfile() {
  return getBrandProfile();
}

async function getContentHistory() {
  const raw = await readJsonFile<unknown>(CONTENT_HISTORY_PATH, []);
  return z.array(historyItemSchema).parse(raw);
}

async function getTopicsHistory() {
  const raw = await readJsonFile<unknown>(TOPICS_HISTORY_PATH, []);
  return z.array(z.string()).parse(raw);
}

function getUpcomingWeekDays(referenceDate = new Date()) {
  const local = new Date(referenceDate);
  const day = local.getDay();
  const daysUntilNextMonday = ((8 - day) % 7) || 7;
  const monday = new Date(local);
  monday.setDate(local.getDate() + daysUntilNextMonday);
  monday.setHours(0, 0, 0, 0);

  return DAY_ORDER.map((label, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);

    return {
      label,
      date: current.toISOString().slice(0, 10)
    };
  });
}

function extractGoogleNewsTitles(xml: string) {
  const matches = [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)];

  return matches
    .map((match) => match[1])
    .filter((title) => title && title !== "Google News")
    .slice(0, 5);
}

async function fetchCurrentTopics(queries: string[]) {
  const topics = new Set<string>();

  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        continue;
      }

      const xml = await response.text();

      for (const title of extractGoogleNewsTitles(xml)) {
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
  weekDays: { label: string; date: string }[];
  currentTopics: string[];
  recentTopics: string[];
}) {
  const weeklyAgenda = input.weekDays
    .map((day) => {
      const config = input.brandProfile.weeklyAgenda[day.label];

      return [
        `Dia: ${day.label} (${day.date})`,
        `Objetivo: ${config?.goal ?? ""}`,
        `Tipos: ${(config?.contentTypes ?? []).join(", ")}`,
        `Formatos: ${(config?.formats ?? []).join(", ")}`
      ].join("\n");
    })
    .join("\n\n");

  return [
    "Você é um agente especialista em marketing digital, social media e automação de conteúdo.",
    "Seu objetivo é gerar automaticamente conteúdos para Instagram para a próxima semana.",
    "Retorne somente JSON válido, sem markdown, com um array chamado week.",
    "Cada item de week deve conter: date, day, goal, type, format, theme, structure, caption, visualIdea, cta, topicKeywords.",
    "As strings devem vir em português do Brasil.",
    "A estrutura deve seguir o cronograma semanal da marca.",
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
    "",
    "Saída esperada por item:",
    "- theme: tema do post",
    "- type: tipo de conteúdo",
    "- format: formato sugerido",
    "- structure: lista de seções/slides",
    "- caption: legenda completa",
    "- visualIdea: ideia visual do post",
    "- cta: chamada para ação",
    "- topicKeywords: 3 a 6 palavras-chave curtas para o histórico"
  ].join("\n");
}

async function requestWeeklyAgenda(prompt: string) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_OLLAMA_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        options: {
          temperature: 0.6
        },
        messages: [
          {
            role: "system",
            content:
              "Você gera agendas editoriais semanais estruturadas para Instagram em JSON puro."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${text}`.trim());
    }

    const parsed = JSON.parse(text) as {
      message?: {
        content?: string;
      };
    };

    const content = parsed.message?.content?.trim();

    if (!content) {
      throw new Error("Ollama did not return weekly agenda content.");
    }

    const json = JSON.parse(
      content.startsWith("```")
        ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
        : content
    ) as {
      week?: unknown;
    };

    return weeklyAgendaSchema.parse(json.week);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateWeeklyContentPlan(referenceDate = new Date()) {
  const brandProfile = await getBrandProfile();
  const weekDays = getUpcomingWeekDays(referenceDate);
  const contentHistory = await getContentHistory();
  const topicsHistory = await getTopicsHistory();
  const recentTopics = topicsHistory.slice(-120);
  const currentTopics = await fetchCurrentTopics(brandProfile.researchQueries);
  const prompt = buildWeeklyPrompt({
    brandProfile,
    weekDays,
    currentTopics,
    recentTopics
  });

  const agenda = await requestWeeklyAgenda(prompt);

  const normalizedTopicHistory = topicsHistory.map(normalizeTopic).filter(Boolean);

  const dedupedAgenda = agenda.filter((item) => {
    const normalizedTheme = normalizeTopic(item.theme);
    const normalizedEntries = buildTopicsHistoryEntries([item]);

    return !normalizedTopicHistory.some(
      (historyEntry) =>
        isSameOrSimilarTopic(normalizedTheme, historyEntry) ||
        normalizedEntries.some((entry) => isSameOrSimilarTopic(entry, historyEntry))
    );
  });

  if (dedupedAgenda.length !== agenda.length) {
    throw new Error("Weekly agenda generation produced repeated themes. Try again.");
  }

  const nextContentHistory = [
    ...contentHistory,
    ...dedupedAgenda.map((item) => ({
      date: item.date,
      day: item.day,
      theme: item.theme
    }))
  ];

  const nextTopicsHistory = Array.from(
    new Set([...topicsHistory.map(normalizeTopic), ...buildTopicsHistoryEntries(dedupedAgenda)])
  ).slice(-300);

  await writeJsonFile(AGENDA_PATH, dedupedAgenda);
  await writeJsonFile(CONTENT_HISTORY_PATH, nextContentHistory);
  await writeJsonFile(TOPICS_HISTORY_PATH, nextTopicsHistory);

  return {
    agenda: dedupedAgenda,
    currentTopics,
    brandProfile
  };
}

export async function getCurrentWeeklyAgenda() {
  return readJsonFile<ContentPlanItem[]>(AGENDA_PATH, []);
}

export async function getContentTopicsHistory() {
  return getTopicsHistory();
}

export async function updateContentBrandProfile(input: unknown) {
  const parsed = brandProfileSchema.parse(input);
  await writeJsonFile(BRAND_PROFILE_PATH, parsed);
  return parsed;
}

export async function clearTopicsHistory() {
  await writeJsonFile(TOPICS_HISTORY_PATH, []);
}

export async function runWeeklyContentAutomationLoop(referenceDate = new Date()) {
  const profile = await getBrandProfile();

  if (!profile.automationLoopEnabled) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "disabled"
    };
  }

  const currentAgenda = await getCurrentWeeklyAgenda();

  if (shouldSkipAutomationLoop(currentAgenda, referenceDate, DAY_ORDER)) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "already-generated"
    };
  }

  const result = await generateWeeklyContentPlan(referenceDate);

  return {
    ok: true as const,
    skipped: false as const,
    ...result
  };
}
