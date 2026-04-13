import type { Dictionary } from "./i18n.en.ts";

export const ptBRGeneratorDictionary: Pick<Dictionary, 'generator' | 'upload' | 'preview' | 'scheduler' | 'instagramCard'> = {
generator: {
  contentTab: "Conteudo",
  settingsTab: "Configuracoes",
  topic: "Produto ou tema",
  topicPlaceholder: "Lancamento de skincare de primavera",
  message: "Promocao ou mensagem",
  messagePlaceholder:
    "Promova a oferta de lancamento por tempo limitado e destaque os ingredientes naturais.",
  postType: "Tipo de post",
  postTypeFeed: "Feed",
  postTypeStory: "Story",
  postTypeCarousel: "Carrossel",
  carouselSlides: "Planejamento do carrossel",
  carouselSlidesDescription: "Escolha quantos slides deseja gerar e, se quiser, descreva o objetivo de cada um. Se ficar em branco, a IA vai inferir a narrativa.",
  carouselSlidesCount: "Quantidade de slides",
  carouselSlideContextLabel: "Contexto do slide",
  carouselSlideContextPlaceholder: "Opcional. Exemplo: prova social, destaque de recurso, preco, CTA.",
  carouselDefaultStructure: "Estrutura padrao do carrossel",
  carouselDefaultStructureDescription: "1 capa com hook, 2 problema/contexto, slides do meio para valor, penultimo slide para insight e ultimo slide para CTA. Voce pode editar qualquer contexto.",
  restoreCarouselStructure: "Restaurar estrutura do carrossel",
  storyMode: "Formato do story",
  storyModeImageOnly: "Somente imagem",
  storyModeWithCaption: "Imagem + legenda",
  storyModeDescription: "Escolha se este story deve ser publicado apenas como imagem ou manter uma legenda no seu fluxo.",
  tone: "Tom",
  toneProfessional: "Profissional",
  toneCasual: "Casual",
  tonePromotional: "Promocional",
  outputLanguage: "Idioma de saida",
  outputLanguageDescription: "Escolha o idioma usado na legenda e nos textos renderizados dentro da imagem gerada.",
  outputLanguageEnglish: "Ingles",
  outputLanguagePtBR: "Portugues (Brasil)",
  briefingMode: "Configuracao do briefing",
  briefingModeDescription: "Escolha se deseja montar o briefing por pontos-chave do negocio ou escrever o prompt completo manualmente.",
  briefingModeGuided: "Briefing guiado",
  briefingModeGuidedDescription: "Preencha os pontos estrategicos mais importantes e deixe o app montar o briefing final.",
  briefingModePrompt: "Prompt completo",
  briefingModePromptDescription: "Escreva a instrucao inteira manualmente quando quiser controle total sobre o briefing.",
  guidedBriefingTitle: "Formulario de briefing guiado",
  guidedBriefingDescription: "Use estes 10 pontos para dar um contexto estrategico mais forte antes da IA escrever os conteudos e visuais.",
  guidedBriefingPreview: "Previa do briefing gerado",
  guidedBriefingPreviewDescription: "Este e o briefing final que sera enviado para a IA enquanto o modo guiado estiver ativo.",
  restoreGuidedBriefing: "Limpar briefing guiado",
  briefingBusinessSummary: "Resumo do negocio",
  briefingTargetAudience: "Publico-alvo",
  briefingMainObjective: "Objetivo principal",
  briefingProductsOrServices: "Produtos ou servicos",
  briefingBrandVoice: "Voz da marca",
  briefingDifferentiators: "Diferenciais",
  briefingPainPoints: "Dores que devem ser abordadas",
  briefingContentPillars: "Pilares de conteudo",
  briefingCtaPreference: "CTA preferido",
  briefingRestrictions: "Restricoes e regras",
  customInstructions: "Formula do prompt",
  customInstructionsDescription: "Personalize a instrucao base enviada para a IA. Voce pode manter a formula padrao ou reescrever para combinar com a voz da sua marca.",
  customInstructionsPlaceholder: "Voce e um especialista em estrategia de conteudo para Instagram e design visual.",
  restoreDefaultInstructions: "Restaurar formula padrao",
  settingsSaved: "Configuracoes salvas com sucesso.",
  settingsSaveError: "Nao foi possivel salvar as configuracoes.",
  removeMedia: "Remover",
  carouselCount: "Itens do carrossel",
  brandColors: "Cores da marca",
  brandColorsHint:
    "Este campo fica fora do preenchimento automatico. Salve as paletas aqui para manter a identidade da marca e poder reutilizar as cores depois de trocar.",
  keywords: "Palavras-chave opcionais",
  keywordsPlaceholder: "beleza limpa, lancamento, oferta limitada",
  generate: "Gerar Post",
  generating: "Gerando...",
  generationProgress: "Gerando seu post",
  generationEstimate: (formattedTimeout, carouselSlideCount) =>
    carouselSlideCount
      ? `Limite estimado: cerca de ${formattedTimeout} no total para este carrossel, com 4 minutos extras adicionados por slide.`
      : `Limite estimado: cerca de ${formattedTimeout} no total enquanto a IA escreve e renderiza a imagem.`,
  generationElapsed: "Tempo decorrido",
  generationSlow: "Ainda estamos processando. Se chegar perto do limite, vamos mostrar timeout em vez de parecer travado.",
  cancelGeneration: "Cancelar geracao",
  generationCanceled: "Geracao cancelada.",
  clearGeneratedPost: "Limpar post atual",
  editCaption: "Editar legenda",
  publishNow: "Publicar agora",
  publishing: "Publicando...",
  saveSchedule: "Salvar agendamento",
  scheduleTimeRequired: "Escolha um horario antes de salvar.",
  generateError: "Nao foi possivel gerar o post.",
  publishError: "Nao foi possivel publicar.",
  scheduleError: "Nao foi possivel agendar.",
  autoGenerateField: "Automatico",
  autoGeneratingField: "Gerando...",
  autoGenerateAllFields: "Automatico geral",
  autoGenerateHint:
    "Usa a estrategia salva e o que ja estiver preenchido como base para manter coerencia no resultado."
},

upload: {
  title: "Enviar imagem personalizada",
  description: "Ao enviar uma imagem, ela substitui a previa gerada por IA na publicacao.",
  carouselTitle: "Enviar imagens do carrossel",
  carouselDescription:
    "Adicione entre 2 e 10 imagens. A imagem gerada pode ser o primeiro slide, e os uploads extras completam o carrossel.",
  markAsAiGenerated: "Marcar imagens enviadas como geradas por IA",
  markAsAiGeneratedDescription:
    "Use esta opcao se as imagens enviadas tambem foram criadas com IA e devem receber a mesma marcacao de metadados.",
  uploading: "Enviando...",
  error: "Falha no upload."
},

preview: {
  imageAlt: "Previa do post gerado",
  empty: "Gere um post para visualizar a previa aqui",
  noCaption: "Ainda nao ha legenda.",
  previous: "Anterior",
  next: "Proximo",
  downloadPost: "Baixar post",
  downloadCurrentSlide: "Baixar slide atual"
},

scheduler: {
  label: "Horario do agendamento"
},

instagramCard: {
  title: "Conta do Instagram conectada",
  username: "Usuario",
  instagramId: "ID do Instagram",
  connectionStatus: "Status da conexao"
},
};
