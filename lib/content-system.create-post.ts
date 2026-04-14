import { sanitizeCustomInstructions } from "@/lib/briefing-builder";
import { z } from "zod";
import { requestAutomaticCreatePostInputs } from "./content-system.requests.ts";
import { brandProfileSchema } from "./content-system.schemas.ts";

const createPostCurrentSchema = z.object({
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
});

const createPostHintSchema = z.object({
  userTopicHint: z.string().optional().default("")
});

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreItemAgainstContext(item: string, context: string) {
  const normalizedItem = normalizeForMatch(item);
  const normalizedContext = normalizeForMatch(context);
  if (!normalizedItem || !normalizedContext) {
    return 0;
  }

  return normalizedItem
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .reduce((score, token) => (normalizedContext.includes(token) ? score + 1 : score), 0);
}

function pickRelevantItems(items: string[], context: string, limit = 4) {
  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreItemAgainstContext(item, context)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.index - right.index;
    })
    .slice(0, Math.min(limit, items.length))
    .map((entry) => entry.item);
}

function buildFallbackServiceAngle(profile: z.infer<typeof brandProfileSchema>, context: string) {
  const relevantServices = pickRelevantItems(profile.services, context, 3);
  const joinedServices = relevantServices.join(", ");

  if (joinedServices) {
    return joinedServices;
  }

  return profile.services.slice(0, 3).join(", ") || "servicos digitais especializados";
}

export async function generateAutomaticCreatePostInputs(input: {
  profile: unknown;
  current: z.infer<typeof createPostCurrentSchema>;
  userTopicHint?: string;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const current = createPostCurrentSchema.parse(input.current);
  const hint = createPostHintSchema.parse({
    userTopicHint: input.userTopicHint
  });
  const currentCustomInstructions = sanitizeCustomInstructions(current.customInstructions);
  const languageLabel = current.outputLanguage === "pt-BR" ? "portugues do Brasil" : "english";
  const activeContext = [
    hint.userTopicHint,
    current.topic,
    current.message,
    current.keywords,
    current.carouselSlideContexts.join(" ")
  ]
    .filter(Boolean)
    .join(" ");
  const relevantServices = pickRelevantItems(profile.services, activeContext, 4);
  const relevantResearchQueries = pickRelevantItems(profile.researchQueries, activeContext, 4);
  const relevantGoalPresets = pickRelevantItems(profile.goalPresets ?? [], activeContext, 3);
  const relevantContentTypePresets = pickRelevantItems(profile.contentTypePresets ?? [], activeContext, 4);
  const relevantFormatPresets = pickRelevantItems(profile.formatPresets ?? [], activeContext, 4);
  const prompt = [
    "Gere sugestoes coerentes para os campos da tela de criacao manual de post.",
    "Use o que ja estiver preenchido como base e nao perca o sentido atual.",
    "Trate Topic, Message e Keywords ja preenchidos como prioridade maxima.",
    "Se houver um foco especifico informado pelo usuario, ele deve ter prioridade maxima.",
    "Use o contexto salvo da estrategia apenas para enriquecer o angulo, sem transformar tudo no mesmo tema.",
    "Se os campos estiverem vazios, varie entre os servicos e ambitos do briefing em vez de repetir sempre o mesmo foco.",
    "Retorne somente JSON valido com as chaves topic, message, keywords, brandColors e carouselSlideContexts.",
    "topic deve ser claro, especifico e bom para um post unico.",
    "message deve ser um direcionamento mais elaborado do angulo do conteudo, util para a IA gerar algo forte.",
    "keywords deve ser uma linha curta com termos separados por virgula.",
    "brandColors deve seguir preferencialmente a estrutura: Cor principal, Cor de fundo, Cor de apoio e Cor de destaque (opcional).",
    "carouselSlideContexts deve ter exatamente a quantidade de slides informada quando postType for carousel. Caso contrario, pode retornar array vazio.",
    "",
    `Idioma esperado: ${languageLabel}`,
    `Post type atual: ${current.postType}`,
    `Tone atual: ${current.tone}`,
    `Topic atual: ${current.topic || "(vazio)"}`,
    `Message atual: ${current.message || "(vazio)"}`,
    `Keywords atuais: ${current.keywords || "(vazio)"}`,
    `Foco especifico informado pelo usuario: ${hint.userTopicHint || "(vazio)"}`,
    `Brand colors atuais: ${current.brandColors || "(vazio)"}`,
    `Quantidade de slides atual: ${current.carouselSlideCount}`,
    `Contextos de slide atuais: ${current.carouselSlideContexts.join(" | ") || "(vazio)"}`,
    "",
    `Marca: ${profile.brandName}`,
    `Briefing: ${profile.editableBrief}`,
    `Servicos mais relevantes para o contexto atual: ${(relevantServices.length > 0 ? relevantServices : profile.services).join(" | ")}`,
    `Regras: ${profile.contentRules.join(" | ")}`,
    `Consultas mais relevantes: ${(relevantResearchQueries.length > 0 ? relevantResearchQueries : profile.researchQueries).join(" | ")}`,
    `Estrutura de carrossel: ${profile.carouselDefaultStructure.join(" | ")}`,
    `Presets de objetivo mais relevantes: ${(relevantGoalPresets.length > 0 ? relevantGoalPresets : profile.goalPresets ?? []).join(" | ")}`,
    `Presets de tipos mais relevantes: ${(relevantContentTypePresets.length > 0 ? relevantContentTypePresets : profile.contentTypePresets ?? []).join(" | ")}`,
    `Presets de formatos mais relevantes: ${(relevantFormatPresets.length > 0 ? relevantFormatPresets : profile.formatPresets ?? []).join(" | ")}`,
    `Prompt atual: ${currentCustomInstructions || "(vazio)"}`
  ].join("\n");
  try {
    return await requestAutomaticCreatePostInputs(prompt);
  } catch {
    const fallbackServiceAngle = buildFallbackServiceAngle(profile, activeContext);
    const fallbackFocus =
      hint.userTopicHint.trim() ||
      current.topic.trim() ||
      `${profile.brandName}: destaque um servico relevante da marca`;

    return {
      topic:
        current.topic.trim() ||
        fallbackFocus,
      message:
        current.message.trim() ||
        `Explique de forma clara como ${fallbackServiceAngle} gera valor para o cliente, conecta o conteudo ao posicionamento da marca e conduz a um CTA consultivo.`,
      keywords:
        current.keywords.trim() ||
        [...pickRelevantItems(profile.services, activeContext, 3)].join(", "),
      brandColors:
        current.brandColors.trim() ||
        "Cor principal: #1d4ed8\nCor de fundo: #101828\nCor de apoio: #38bdf8\nCor de destaque: #f8fafc",
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
