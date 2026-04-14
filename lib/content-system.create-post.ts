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

export async function generateAutomaticCreatePostInputs(input: {
  profile: unknown;
  current: z.infer<typeof createPostCurrentSchema>;
}) {
  const profile = brandProfileSchema.parse(input.profile);
  const current = createPostCurrentSchema.parse(input.current);
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
    "brandColors deve seguir preferencialmente a estrutura: Cor principal, Cor de fundo, Cor de apoio e Cor de destaque (opcional).",
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
        [profile.services[0] ?? "automacao", profile.services[1] ?? "produtividade", "eficiencia operacional"].join(", "),
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
