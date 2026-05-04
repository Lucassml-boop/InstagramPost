import { requestWeeklyAgenda } from "./content-system.requests.ts";
import { getDayConfig, type WeekSlot } from "./content-system.schedule.ts";
import type { BrandProfile } from "./content-system.schemas.ts";
import { saveCurrentTopics } from "./content-system.storage.ts";

function extractGoogleNewsTitles(xml: string) {
  return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
    .map((match) => match[1])
    .filter((title) => title && title !== "Google News")
    .slice(0, 5);
}

export async function fetchCurrentTopics(queries: string[], userId?: string) {
  const topics = new Set<string>();
  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
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

export function buildWeeklyPrompt(input: {
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

export async function requestPromptedWeeklyAgenda(
  input: Parameters<typeof buildWeeklyPrompt>[0]
) {
  return requestWeeklyAgenda(buildWeeklyPrompt(input), input.weekSlots.length);
}
