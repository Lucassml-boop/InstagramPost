import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";
import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import {
  buildTopicsHistoryEntries,
  getAgendaWeekKey,
  getUpcomingWeekKey,
  isSameOrSimilarTopic,
  normalizeTopic,
  shouldRunTopicsHistoryCleanup,
  shouldSkipAutomationLoop,
  type TopicsHistoryCleanupFrequency
} from "@/lib/content-system-utils";
import { requireEnv } from "@/lib/env";

const contentPlanItemSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
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

function createWeeklyAgendaSchema(expectedCount: number) {
  return z.array(contentPlanItemSchema).length(expectedCount);
}

const brandProfileSchema = z.object({
  brandName: z.string().min(1),
  editableBrief: z.string().min(1),
  automationLoopEnabled: z.boolean().default(true),
  topicsHistoryCleanupFrequency: z
    .enum(["disabled", "daily", "weekly", "monthly"])
    .default("monthly"),
  services: z.array(z.string().min(1)).min(1),
  weeklyAgenda: z.record(
    z.object({
      enabled: z.boolean().default(true),
      goal: z.string().default(""),
      contentTypes: z.array(z.string().min(1)).default([]),
      formats: z.array(z.string().min(1)).default([]),
      postsPerDay: z.number().int().min(1).max(10).default(1),
      postTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).default(["09:00"]),
      postIdeas: z
        .array(
          z.object({
            goal: z.string().default(""),
            contentTypes: z.array(z.string().min(1)).default([]),
            formats: z.array(z.string().min(1)).default([])
          })
        )
        .default([])
    })
  ),
  carouselDefaultStructure: z.array(z.string().min(1)).min(1),
  contentRules: z.array(z.string().min(1)).min(1),
  researchQueries: z.array(z.string().min(1)).min(1),
  goalPresets: z.array(z.string().min(1)).default([]),
  contentTypePresets: z.array(z.string().min(1)).default([]),
  formatPresets: z.array(z.string().min(1)).default([])
});

const historyItemSchema = z.object({
  date: z.string().min(1),
  day: z.string().min(1),
  theme: z.string().min(1)
});

const automaticPostIdeaSchema = z.object({
  goal: z.string().min(20),
  contentTypes: z.array(z.string().min(8)).min(3).max(6),
  formats: z.array(z.string().min(5)).min(3).max(5)
});
const automaticSettingTargetSchema = z.enum([
  "brandName",
  "editableBrief",
  "services",
  "contentRules",
  "researchQueries",
  "carouselDefaultStructure",
  "goalPresets",
  "contentTypePresets",
  "formatPresets",
  "customInstructions"
]);
const automaticSettingSchema = z.object({
  value: z.string().min(1)
});
const automaticSettingsBundleSchema = z.object({
  brandName: z.string().min(1),
  editableBrief: z.string().min(1),
  services: z.string().min(1),
  contentRules: z.string().min(1),
  researchQueries: z.string().min(1),
  carouselDefaultStructure: z.string().min(1),
  goalPresets: z.string().min(1),
  contentTypePresets: z.string().min(1),
  formatPresets: z.string().min(1),
  customInstructions: z.string().min(1)
});
const automaticCreatePostInputsSchema = z.object({
  topic: z.string().min(2),
  message: z.string().min(2),
  keywords: z.string(),
  brandColors: z.string().min(2),
  carouselSlideContexts: z.array(z.string()).max(10)
});

export type ContentPlanItem = z.infer<typeof contentPlanItemSchema>;
export type BrandProfile = z.infer<typeof brandProfileSchema>;
type HistoryItem = z.infer<typeof historyItemSchema>;
export type AutomaticPostIdea = z.infer<typeof automaticPostIdeaSchema>;
export type AutomaticSettingTarget = z.infer<typeof automaticSettingTargetSchema>;

const CONTENT_SYSTEM_DIR = path.join(process.cwd(), "content-system");
const AGENDA_PATH = path.join(CONTENT_SYSTEM_DIR, "agenda.json");
const CONTENT_HISTORY_PATH = path.join(CONTENT_SYSTEM_DIR, "content_history.json");
const TOPICS_HISTORY_PATH = path.join(CONTENT_SYSTEM_DIR, "topics_history.json");
const TOPICS_PATH = path.join(CONTENT_SYSTEM_DIR, "topics.json");
const BRAND_PROFILE_PATH = path.join(CONTENT_SYSTEM_DIR, "brand_profile.json");
const DAY_ORDER = [
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
  "Domingo"
] as const;
const DEFAULT_OLLAMA_TIMEOUT_MS = 480_000;
const DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS = 45_000;
const DEFAULT_DISABLED_DAYS = new Set(["Sabado", "Domingo"]);

type DayConfig = {
  enabled: boolean;
  postsPerDay: number;
  postTimes: string[];
  postIdeas: Array<{
    goal: string;
    contentTypes: string[];
    formats: string[];
  }>;
};

type WeekSlot = {
  label: (typeof DAY_ORDER)[number];
  date: string;
  time: string;
  slotIndex: number;
  postsPerDay: number;
  goal: string;
  contentTypes: string[];
  formats: string[];
};

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

export const getContentBrandProfile = cache(async () => getBrandProfile());

async function getContentHistory() {
  const raw = await readJsonFile<unknown>(CONTENT_HISTORY_PATH, []);
  return z.array(historyItemSchema).parse(raw);
}

async function getTopicsHistory() {
  const raw = await readJsonFile<unknown>(TOPICS_HISTORY_PATH, []);
  return z.array(z.string()).parse(raw);
}

function normalizeStoredAgenda(items: unknown[]) {
  return items.map((item) => {
    const candidate = (item ?? {}) as Partial<ContentPlanItem>;
    return {
      ...candidate,
      time: normalizeTimeValue(String(candidate.time ?? "")) ?? "09:00"
    };
  });
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

function normalizeTimeValue(value: string) {
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

function shiftTime(base: string, offsetHours: number) {
  const [hours, minutes] = base.split(":").map((value) => Number.parseInt(value, 10));
  const totalMinutes =
    ((hours * 60 + minutes + offsetHours * 60) % (24 * 60) + 24 * 60) % (24 * 60);

  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60
  ).padStart(2, "0")}`;
}

function getDayConfig(profile: BrandProfile, day: (typeof DAY_ORDER)[number]): DayConfig {
  const config = profile.weeklyAgenda[day];

  return {
    enabled: config?.enabled ?? !DEFAULT_DISABLED_DAYS.has(day),
    postsPerDay: Math.min(Math.max(config?.postsPerDay ?? 1, 1), 10),
    postTimes: (config?.postTimes ?? [])
      .map((value) => normalizeTimeValue(value))
      .filter(Boolean) as string[],
    postIdeas: Array.from({ length: Math.min(Math.max(config?.postsPerDay ?? 1, 1), 10) }, (_, index) => {
      const savedIdea = config?.postIdeas?.[index];
      return {
        goal: savedIdea?.goal?.trim() || (index === 0 ? config?.goal?.trim() ?? "" : ""),
        contentTypes: (savedIdea?.contentTypes ??
          (index === 0 ? config?.contentTypes : []) ??
          [])
          .map((item) => item.trim())
          .filter(Boolean),
        formats: (savedIdea?.formats ?? (index === 0 ? config?.formats : []) ?? [])
          .map((item) => item.trim())
          .filter(Boolean)
      };
    })
  };
}

function expandPostTimes(postTimes: string[], postsPerDay: number) {
  const times = postTimes.length > 0 ? [...postTimes] : ["09:00"];

  while (times.length < postsPerDay) {
    times.push(shiftTime(times[0], times.length * 3));
  }

  return times.slice(0, postsPerDay);
}

function buildWeekSlots(profile: BrandProfile, referenceDate = new Date()) {
  const weekDays = getUpcomingWeekDays(referenceDate);
  const slots: WeekSlot[] = [];

  for (const day of weekDays) {
    const config = getDayConfig(profile, day.label);

    if (!config.enabled) {
      continue;
    }

    const times = expandPostTimes(config.postTimes, config.postsPerDay);

    for (const [index, time] of times.entries()) {
      const postIdea = config.postIdeas[index] ?? {
        goal: "",
        contentTypes: [],
        formats: []
      };
      slots.push({
        label: day.label,
        date: day.date,
        time,
        slotIndex: index + 1,
        postsPerDay: config.postsPerDay,
        goal: postIdea.goal,
        contentTypes: postIdea.contentTypes,
        formats: postIdea.formats
      });
    }
  }

  return slots;
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
  weekSlots: WeekSlot[];
  currentTopics: string[];
  recentTopics: string[];
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
    "Seu objetivo é gerar automaticamente conteúdos para Instagram para a próxima semana.",
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

async function requestWeeklyAgenda(prompt: string, expectedCount: number) {
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

    return createWeeklyAgendaSchema(expectedCount).parse(json.week);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestAutomaticPostIdea(prompt: string) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeoutMs = Number(
    process.env.AUTOMATIC_POST_IDEA_TIMEOUT_MS ?? DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS
  );
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
          temperature: 0.7
        },
        messages: [
          {
            role: "system",
            content:
              "Voce cria direcionamentos editoriais detalhados para posts de Instagram e responde somente com JSON puro."
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
      throw new Error("Ollama did not return automatic post idea content.");
    }

    return automaticPostIdeaSchema.parse(
      JSON.parse(
        content.startsWith("```")
          ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
          : content
      )
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function requestAutomaticSetting(prompt: string) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeoutMs = Number(
    process.env.AUTOMATIC_SETTING_TIMEOUT_MS ?? DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS
  );
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
          temperature: 0.7
        },
        messages: [
          {
            role: "system",
            content:
              "Voce melhora configuracoes editoriais para Instagram e responde somente com JSON puro."
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
      throw new Error("Ollama did not return automatic setting content.");
    }

    return automaticSettingSchema.parse(
      JSON.parse(
        content.startsWith("```")
          ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
          : content
      )
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function requestAutomaticSettingsBundle(prompt: string) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeoutMs = Number(
    process.env.AUTOMATIC_SETTINGS_BUNDLE_TIMEOUT_MS ?? 60_000
  );
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
          temperature: 0.7
        },
        messages: [
          {
            role: "system",
            content:
              "Voce recalibra configuracoes editoriais completas para Instagram e responde somente com JSON puro."
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
      throw new Error("Ollama did not return automatic settings bundle content.");
    }

    return automaticSettingsBundleSchema.parse(
      JSON.parse(
        content.startsWith("```")
          ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
          : content
      )
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function requestAutomaticCreatePostInputs(prompt: string) {
  const apiKey = requireEnv("OLLAMA_API_KEY");
  const model = process.env.OLLAMA_MODEL?.trim() || "kimi-k2.5:cloud";
  const controller = new AbortController();
  const timeoutMs = Number(process.env.AUTOMATIC_CREATE_POST_TIMEOUT_MS ?? 45_000);
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
          temperature: 0.7
        },
        messages: [
          {
            role: "system",
            content:
              "Voce prepara inputs coerentes para criacao manual de posts de Instagram e responde somente com JSON puro."
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

    const parsed = JSON.parse(text) as { message?: { content?: string } };
    const content = parsed.message?.content?.trim();

    if (!content) {
      throw new Error("Ollama did not return automatic create-post inputs content.");
    }

    return automaticCreatePostInputsSchema.parse(
      JSON.parse(
        content.startsWith("```")
          ? content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
          : content
      )
    );
  } finally {
    clearTimeout(timeout);
  }
}

function pickRotatingItems(items: string[], start: number, count: number) {
  if (items.length === 0) {
    return [];
  }

  return Array.from({ length: Math.min(count, items.length) }, (_, index) => {
    const safeIndex = (start + index) % items.length;
    return items[safeIndex];
  });
}

function buildFallbackAutomaticPostIdea(input: {
  profile: BrandProfile;
  day: (typeof DAY_ORDER)[number];
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

function buildFallbackAutomaticSetting(input: {
  target: AutomaticSettingTarget;
  currentValue: string;
  profile: BrandProfile;
}) {
  const normalizedCurrentValue = input.currentValue.trim();

  switch (input.target) {
    case "brandName":
      return {
        value: normalizedCurrentValue || input.profile.brandName || "Marca de tecnologia e automacao"
      };
    case "editableBrief":
      return {
        value:
          normalizedCurrentValue ||
          `A ${input.profile.brandName} ajuda empresas a crescer com tecnologia aplicada, automacao de processos, integracoes e sistemas sob medida. O foco do conteudo deve ser educar, gerar autoridade e mostrar como a empresa simplifica operacoes, melhora a produtividade e apoia decisoes mais inteligentes.`
      };
    case "services":
      return {
        value:
          normalizedCurrentValue ||
          [
            "automacao de processos operacionais com foco em ganho de produtividade",
            "integracoes entre marketplaces, estoque, vendas e sistemas internos",
            "desenvolvimento de sistemas sob medida para controle e gestao",
            "dashboards e paineis gerenciais para tomada de decisao",
            "solucoes com IA para atendimento, triagem e eficiencia comercial"
          ].join("\n")
      };
    case "contentRules":
      return {
        value:
          normalizedCurrentValue ||
          [
            "Priorizar clareza, autoridade e aplicacao pratica em contexto empresarial.",
            "Explicar problemas operacionais reais antes de apresentar a solucao.",
            "Evitar temas rasos, genéricos ou sem relacao direta com o servico.",
            "Conectar cada conteudo a impacto em vendas, tempo, controle ou escala.",
            "Encerrar com CTA coerente com diagnostico, conversa ou demonstracao."
          ].join("\n")
      };
    case "researchQueries":
      return {
        value:
          normalizedCurrentValue ||
          [
            "automacao para pequenas e medias empresas",
            "integracao mercado livre estoque vendas",
            "shopee vendedores operacao e produtividade",
            "ia aplicada ao atendimento comercial",
            "sistemas para centralizar operacao de e-commerce"
          ].join("\n")
      };
    case "carouselDefaultStructure":
      return {
        value:
          normalizedCurrentValue ||
          [
            "Hook forte com dor ou oportunidade clara",
            "Contexto do problema no dia a dia da empresa",
            "Explicacao do impacto operacional ou comercial",
            "Caminho pratico ou insight aplicavel",
            "Fechamento com CTA para conversa ou diagnostico"
          ].join("\n")
      };
    case "goalPresets":
      return {
        value:
          normalizedCurrentValue ||
          [
            "Posicionar a marca como referencia confiavel em automacao aplicada a negocios.",
            "Educar o publico sobre gargalos operacionais e como resolvelos com tecnologia.",
            "Gerar demanda qualificada mostrando impacto real em produtividade e controle.",
            "Aumentar percepcao de valor com conteudos que combinam clareza, estrategia e exemplo pratico."
          ].join("\n")
      };
    case "contentTypePresets":
      return {
        value:
          normalizedCurrentValue ||
          [
            "explicacoes consultivas de processos e gargalos operacionais",
            "comparacoes entre rotina manual e fluxo automatizado",
            "diagnosticos de erro comum em operacoes digitais",
            "checklists praticos para empresas que querem ganhar escala",
            "cenarios reais de aplicacao de integracoes, IA e sistemas sob medida"
          ].join("\n")
      };
    case "formatPresets":
      return {
        value:
          normalizedCurrentValue ||
          [
            "Carrossel consultivo com contexto, diagnostico, caminho pratico e CTA",
            "Reels explicativo com abertura forte, exemplo real e fechamento objetivo",
            "Post estatico com headline estrategica, argumento central e CTA claro",
            "Sequencia de stories com pergunta inicial, desenvolvimento e convite para contato"
          ].join("\n")
      };
    case "customInstructions":
      return {
        value:
          normalizedCurrentValue ||
          `You are an expert Instagram content strategist, copywriter, and visual designer focused on ${input.profile.brandName}. Create posts that feel modern, clear, persuasive, and useful for business owners who want automation, efficiency, digital growth, and better operational control.`
      };
  }
}

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

  const prompt = [
    "Crie um direcionamento editorial detalhado para um unico post de Instagram em portugues do Brasil.",
    "Retorne somente JSON valido com as chaves goal, contentTypes e formats.",
    "goal deve ser um objetivo mais elaborado, em 1 ou 2 frases, explicando o papel estrategico do post.",
    "contentTypes deve ter entre 3 e 6 tipos de conteudo, cada item com mais contexto e especificidade, evitando respostas curtas demais.",
    "formats deve ter entre 3 e 5 sugestoes de formato para Instagram, mais detalhadas e acionaveis do que nomes simples.",
    "Nao repita a mesma linha editorial dos outros posts do mesmo dia.",
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
      ? `Outros posts do mesmo dia para diferenciar: ${siblingIdeas
          .map(
            (idea) =>
              `slot ${idea.slot}: objetivo=${idea.goal || "nao definido"}; tipos=${idea.contentTypes.join(", ") || "nao definidos"}; formatos=${idea.formats.join(", ") || "nao definidos"}`
          )
          .join(" || ")}`
      : "Nao ha outros posts definidos para este dia.",
    "",
    "Priorize clareza estrategica, variedade editorial e informacoes que ajudem outra IA a produzir um post melhor."
  ].join("\n");

  try {
    return await requestAutomaticPostIdea(prompt);
  } catch {
    return buildFallbackAutomaticPostIdea({
      profile,
      day,
      postIndex,
      siblingIdeas
    });
  }
}

export async function generateAutomaticSetting(input: {
  profile: unknown;
  target: string;
  currentValue: string;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const target = automaticSettingTargetSchema.parse(input.target);
  const currentValue = z.string().parse(input.currentValue);
  const listTargets = new Set([
    "services",
    "contentRules",
    "researchQueries",
    "carouselDefaultStructure",
    "goalPresets",
    "contentTypePresets",
    "formatPresets"
  ]);
  const fieldInstructions = {
    brandName:
      "Retorne um nome curto e forte, sem explicacoes extras. Preserve a identidade principal do nome atual, mas refine se fizer sentido.",
    editableBrief:
      "Retorne um briefing mais elaborado, mantendo a mesma proposta central, em um paragrafo mais estrategico e util para IA.",
    services:
      "Retorne uma lista com 4 a 6 linhas, cada uma com um servico mais claro, especifico e orientado a resultado.",
    contentRules:
      "Retorne uma lista com 4 a 6 linhas de regras editoriais claras e acionaveis.",
    researchQueries:
      "Retorne uma lista com 4 a 6 consultas de pesquisa mais especificas para descobrir temas atuais e relevantes.",
    carouselDefaultStructure:
      "Retorne uma lista com 4 a 6 etapas de estrutura para carrossel, mais claras e estrategicas.",
    goalPresets:
      "Retorne uma lista com 4 a 6 presets de objetivo mais elaborados e estrategicos.",
    contentTypePresets:
      "Retorne uma lista com 4 a 6 presets de tipos de conteudo mais especificos e ricos.",
    formatPresets:
      "Retorne uma lista com 4 a 6 presets de formatos mais detalhados e acionaveis.",
    customInstructions:
      "Retorne uma formula de prompt completa em ingles, mantendo a intencao atual, mas com mais contexto, clareza e direcionamento."
  } satisfies Record<AutomaticSettingTarget, string>;
  const dependencyValues = {
    brandName: profile.brandName,
    editableBrief: profile.editableBrief,
    services: profile.services.join("\n"),
    contentRules: profile.contentRules.join("\n"),
    researchQueries: profile.researchQueries.join("\n"),
    carouselDefaultStructure: profile.carouselDefaultStructure.join("\n"),
    goalPresets: (profile.goalPresets ?? []).join("\n"),
    contentTypePresets: (profile.contentTypePresets ?? []).join("\n"),
    formatPresets: (profile.formatPresets ?? []).join("\n"),
    customInstructions: input.currentValue
  } satisfies Record<AutomaticSettingTarget, string>;
  const prioritizedDependencies = buildTargetDependencies(target)
    .map((dependency) => `${dependency}: ${dependencyValues[dependency] || "(vazio)"}`)
    .join("\n");

  const prompt = [
    "Reescreva ou expanda uma configuracao editorial de Instagram usando o valor atual como base.",
    "Nao descarte o sentido do texto atual. Preserve a intencao principal e melhore a clareza, especificidade e profundidade.",
    "Os campos prioritarios listados abaixo devem ter mais peso do que os demais no resultado final.",
    "Retorne somente JSON valido com a chave value.",
    fieldInstructions[target],
    listTargets.has(target)
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
    return buildFallbackAutomaticSetting({
      target,
      currentValue,
      profile
    });
  }
}

export async function generateAutomaticSettingsBundle(input: {
  profile: unknown;
  customInstructions: string;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const customInstructions = sanitizeCustomInstructions(z.string().parse(input.customInstructions));
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
    return {
      brandName: buildFallbackAutomaticSetting({
        target: "brandName",
        currentValue: profile.brandName,
        profile
      }).value,
      editableBrief: buildFallbackAutomaticSetting({
        target: "editableBrief",
        currentValue: profile.editableBrief,
        profile
      }).value,
      services: buildFallbackAutomaticSetting({
        target: "services",
        currentValue: profile.services.join("\n"),
        profile
      }).value,
      contentRules: buildFallbackAutomaticSetting({
        target: "contentRules",
        currentValue: profile.contentRules.join("\n"),
        profile
      }).value,
      researchQueries: buildFallbackAutomaticSetting({
        target: "researchQueries",
        currentValue: profile.researchQueries.join("\n"),
        profile
      }).value,
      carouselDefaultStructure: buildFallbackAutomaticSetting({
        target: "carouselDefaultStructure",
        currentValue: profile.carouselDefaultStructure.join("\n"),
        profile
      }).value,
      goalPresets: buildFallbackAutomaticSetting({
        target: "goalPresets",
        currentValue: (profile.goalPresets ?? []).join("\n"),
        profile
      }).value,
      contentTypePresets: buildFallbackAutomaticSetting({
        target: "contentTypePresets",
        currentValue: (profile.contentTypePresets ?? []).join("\n"),
        profile
      }).value,
      formatPresets: buildFallbackAutomaticSetting({
        target: "formatPresets",
        currentValue: (profile.formatPresets ?? []).join("\n"),
        profile
      }).value,
      customInstructions: buildFallbackAutomaticSetting({
        target: "customInstructions",
        currentValue: customInstructions,
        profile
      }).value
    };
  }
}

export async function generateAutomaticCreatePostInputs(input: {
  profile: unknown;
  current: {
    topic: string;
    message: string;
    postType: "feed" | "story" | "carousel";
    tone: "professional" | "casual" | "promotional";
    brandColors: string;
    keywords: string;
    carouselSlideCount: number;
    carouselSlideContexts: string[];
    outputLanguage: "en" | "pt-BR";
    customInstructions: string;
  };
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const current = z
    .object({
      topic: z.string(),
      message: z.string(),
      postType: z.enum(["feed", "story", "carousel"]),
      tone: z.enum(["professional", "casual", "promotional"]),
      brandColors: z.string(),
      keywords: z.string(),
      carouselSlideCount: z.number().int().min(2).max(10),
      carouselSlideContexts: z.array(z.string()).max(10),
      outputLanguage: z.enum(["en", "pt-BR"]),
      customInstructions: z.string()
    })
    .parse(input.current);
  const currentCustomInstructions = sanitizeCustomInstructions(current.customInstructions);
  const languageLabel = current.outputLanguage === "pt-BR" ? "portugues do Brasil" : "english";

  const prompt = [
    "Gere sugestoes coerentes para os campos da tela de criacao manual de post.",
    "Use o que ja estiver preenchido como base e nao perca o sentido atual.",
    "Use fortemente o contexto salvo da estrategia, briefing, servicos, regras, pesquisas, presets e prompt atual.",
    "Retorne somente JSON valido com as chaves topic, message, keywords, brandColors e carouselSlideContexts.",
    "topic deve ser claro, especifico e bom para um post unico.",
    "message deve ser um direcionamento mais elaborado do angulo do conteudo, util para a IA gerar algo forte.",
    "keywords deve ser uma linha curta com termos separados por virgula.",
    "brandColors deve ser uma linha curta de cores coerentes com a marca.",
    "carouselSlideContexts deve ter exatamente a quantidade de slides informada quando postType for carousel. Caso contrario, pode retornar array vazio.",
    "",
    `Idioma esperado: ${languageLabel}`,
    `Post type atual: ${current.postType}`,
    `Tone atual: ${current.tone}`,
    `Topic atual: ${current.topic || "(vazio)"}`,
    `Message atual: ${current.message || "(vazio)"}`,
    `Keywords atuais: ${current.keywords || "(vazio)"}`,
    `Brand colors atuais: ${current.brandColors || "(vazio)"}`,
    `Quantidade de slides atual: ${current.carouselSlideCount}`,
    `Contextos de slide atuais: ${current.carouselSlideContexts.join(" | ") || "(vazio)"}`,
    "",
    `Marca: ${profile.brandName}`,
    `Briefing: ${profile.editableBrief}`,
    `Servicos: ${profile.services.join(" | ")}`,
    `Regras: ${profile.contentRules.join(" | ")}`,
    `Consultas: ${profile.researchQueries.join(" | ")}`,
    `Estrutura de carrossel: ${profile.carouselDefaultStructure.join(" | ")}`,
    `Presets de objetivo: ${(profile.goalPresets ?? []).join(" | ")}`,
    `Presets de tipos: ${(profile.contentTypePresets ?? []).join(" | ")}`,
    `Presets de formatos: ${(profile.formatPresets ?? []).join(" | ")}`,
    `Prompt atual: ${currentCustomInstructions || "(vazio)"}`
  ].join("\n");

  try {
    return await requestAutomaticCreatePostInputs(prompt);
  } catch {
    return {
      topic:
        current.topic.trim() ||
        `${profile.brandName}: automacao aplicada para melhorar operacao e crescimento`,
      message:
        current.message.trim() ||
        `Explique de forma clara como ${profile.services[0] ?? "automacao"} ajuda empresas a ganhar produtividade, reduzir falhas operacionais e tomar decisoes melhores, conectando o conteudo ao posicionamento da marca e a um CTA consultivo.`,
      keywords:
        current.keywords.trim() ||
        [
          profile.services[0] ?? "automacao",
          profile.services[1] ?? "produtividade",
          "eficiencia operacional"
        ].join(", "),
      brandColors: current.brandColors.trim() || "#101828, #1d4ed8, #38bdf8",
      carouselSlideContexts:
        current.postType === "carousel"
          ? Array.from({ length: current.carouselSlideCount }, (_, index) => {
              return (
                current.carouselSlideContexts[index]?.trim() ||
                profile.carouselDefaultStructure[index] ||
                `Slide ${index + 1} desenvolve o raciocinio principal do post com clareza e progressao.`
              );
            })
          : []
    };
  }
}

export async function generateWeeklyContentPlan(referenceDate = new Date()) {
  const brandProfile = await getBrandProfile();
  const weekSlots = buildWeekSlots(brandProfile, referenceDate);

  if (weekSlots.length === 0) {
    throw new Error("At least one active day with a valid post schedule is required.");
  }

  const contentHistory = await getContentHistory();
  const topicsHistory = await getTopicsHistory();
  const recentTopics = topicsHistory.slice(-120);
  const currentTopics = await fetchCurrentTopics(brandProfile.researchQueries);
  const prompt = buildWeeklyPrompt({
    brandProfile,
    weekSlots,
    currentTopics,
    recentTopics
  });

  const generatedAgenda = await requestWeeklyAgenda(prompt, weekSlots.length);
  const agenda = generatedAgenda.map((item, index) => ({
    ...item,
    date: weekSlots[index]?.date ?? item.date,
    day: weekSlots[index]?.label ?? item.day,
    time: weekSlots[index]?.time ?? item.time
  }));

  const normalizedTopicHistory = topicsHistory.map(normalizeTopic).filter(Boolean);
  const generatedTopics = new Set<string>();

  const dedupedAgenda = agenda.filter((item) => {
    const normalizedTheme = normalizeTopic(item.theme);
    const normalizedEntries = buildTopicsHistoryEntries([item]);
    const hasInternalDuplicate =
      generatedTopics.has(normalizedTheme) ||
      Array.from(generatedTopics).some((entry) =>
        normalizedEntries.some((topic) => isSameOrSimilarTopic(topic, entry))
      );

    if (hasInternalDuplicate) {
      return false;
    }

    generatedTopics.add(normalizedTheme);
    normalizedEntries.forEach((entry) => generatedTopics.add(entry));

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

export const getCurrentWeeklyAgenda = cache(async () => {
  const agenda = await readJsonFile<unknown[]>(AGENDA_PATH, []);
  return normalizeStoredAgenda(agenda) as ContentPlanItem[];
});

export const getContentTopicsHistory = cache(async () => getTopicsHistory());

export async function updateContentBrandProfile(input: unknown) {
  const parsed = brandProfileSchema.parse(input);
  await writeJsonFile(BRAND_PROFILE_PATH, parsed);
  return parsed;
}

export async function clearTopicsHistory() {
  const current = await getTopicsHistory();
  await writeJsonFile(TOPICS_HISTORY_PATH, []);
  return {
    clearedEntries: current.length
  };
}

export async function runMonthlyTopicsHistoryCleanup() {
  const result = await clearTopicsHistory();

  return {
    ok: true as const,
    ...result
  };
}

export async function runTopicsHistoryCleanupAutomation(referenceDate = new Date()) {
  const profile = await getBrandProfile();
  const frequency = profile.topicsHistoryCleanupFrequency as TopicsHistoryCleanupFrequency;

  if (!shouldRunTopicsHistoryCleanup(frequency, referenceDate)) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "not-scheduled-today",
      frequency
    };
  }

  const result = await clearTopicsHistory();

  return {
    ok: true as const,
    skipped: false as const,
    frequency,
    ...result
  };
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
  const enabledDays = DAY_ORDER.filter((day) => getDayConfig(profile, day).enabled);

  if (shouldSkipAutomationLoop(currentAgenda, referenceDate, enabledDays)) {
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
