export const LOCALE_COOKIE_NAME = "site_locale";
export const locales = ["en", "pt-BR"] as const;

export type Locale = (typeof locales)[number];

type Dictionary = {
  common: {
    appName: string;
    reviewDemo: string;
    preview: string;
    caption: string;
    status: string;
    connected: string;
    notConnected: string;
    pending: string;
    save: string;
  };
  language: {
    label: string;
    en: string;
    ptBR: string;
  };
  sidebar: {
    dashboard: string;
    connectInstagram: string;
    createPost: string;
    scheduledPosts: string;
    contentAutomation: string;
  };
  login: {
    title: string;
    description: string;
    email: string;
    password: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    continueError: string;
  };
  dashboard: {
    eyebrow: string;
    title: string;
    description: (email: string) => string;
    logout: string;
    connectedSuccess: string;
    publishedSuccess: string;
    connectionStatus: string;
    scheduledPosts: string;
    publishedPosts: string;
    noAccountTitle: string;
    noAccountDescription: string;
    connectInstagram: string;
    quickActions: string;
    createPost: string;
    viewScheduledPosts: string;
    connectedAccount: string;
  };
  connectInstagram: {
    eyebrow: string;
    title: string;
    description: string;
    body: string;
    button: string;
  };
  createPost: {
    eyebrow: string;
    title: string;
    description: string;
  };
  generator: {
    contentTab: string;
    settingsTab: string;
    topic: string;
    topicPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    postType: string;
    postTypeFeed: string;
    postTypeStory: string;
    postTypeCarousel: string;
    carouselSlides: string;
    carouselSlidesDescription: string;
    carouselSlidesCount: string;
    carouselSlideContextLabel: string;
    carouselSlideContextPlaceholder: string;
    carouselDefaultStructure: string;
    carouselDefaultStructureDescription: string;
    restoreCarouselStructure: string;
    storyMode: string;
    storyModeImageOnly: string;
    storyModeWithCaption: string;
    storyModeDescription: string;
    tone: string;
    toneProfessional: string;
    toneCasual: string;
    tonePromotional: string;
    outputLanguage: string;
    outputLanguageDescription: string;
    outputLanguageEnglish: string;
    outputLanguagePtBR: string;
    customInstructions: string;
    customInstructionsDescription: string;
    customInstructionsPlaceholder: string;
    restoreDefaultInstructions: string;
    settingsSaved: string;
    settingsSaveError: string;
    removeMedia: string;
    carouselCount: string;
    brandColors: string;
    keywords: string;
    keywordsPlaceholder: string;
    generate: string;
    generating: string;
    generationProgress: string;
    generationEstimate: string;
    generationElapsed: string;
    generationSlow: string;
    editCaption: string;
    publishNow: string;
    publishing: string;
    saveSchedule: string;
    scheduleTimeRequired: string;
    generateError: string;
    publishError: string;
    scheduleError: string;
  };
  upload: {
    title: string;
    description: string;
    carouselTitle: string;
    carouselDescription: string;
    markAsAiGenerated: string;
    markAsAiGeneratedDescription: string;
    uploading: string;
    error: string;
  };
  preview: {
    imageAlt: string;
    empty: string;
    noCaption: string;
    previous: string;
    next: string;
  };
  scheduler: {
    label: string;
  };
  instagramCard: {
    title: string;
    username: string;
    instagramId: string;
    connectionStatus: string;
  };
  scheduledPage: {
    eyebrow: string;
    title: string;
    description: string;
    savedSuccess: string;
    preview: string;
    caption: string;
    scheduledTime: string;
    status: string;
    noPosts: string;
    previewAlt: string;
  };
  contentAutomation: {
    eyebrow: string;
    title: string;
    description: string;
    brandName: string;
    editableBrief: string;
    automationLoopEnabled: string;
    automationLoopDescription: string;
    services: string;
    contentRules: string;
    researchQueries: string;
    carouselDefaultStructure: string;
    listHint: string;
    howItWorksTitle: string;
    howItWorksDescription: string;
    scheduleLabel: string;
    scheduleDescription: string;
    weeklyAgendaTitle: string;
    weeklyAgendaDescription: string;
    dayGoal: string;
    dayTypes: string;
    dayFormats: string;
    saveButton: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    generateButton: string;
    generating: string;
    generateHint: string;
    generateSuccess: string;
    generateError: string;
    currentTopics: string;
    topicsHistoryTitle: string;
    topicsHistoryDescription: string;
    clearTopicsHistory: string;
    clearTopicsHistorySuccess: string;
    clearTopicsHistoryError: string;
    noTopicsHistory: string;
    generatedAgendaTitle: string;
    generatedAgendaDescription: string;
    noAgenda: string;
    structure: string;
    visualIdea: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    common: {
      appName: "AI Publisher",
      reviewDemo: "Instagram Review Demo",
      preview: "Preview",
      caption: "Caption",
      status: "Status",
      connected: "Connected",
      notConnected: "Not connected",
      pending: "Pending",
      save: "Save"
    },
    language: {
      label: "Language",
      en: "English",
      ptBR: "Portuguese (Brazil)"
    },
    sidebar: {
      dashboard: "Dashboard",
      connectInstagram: "Connect Instagram",
      createPost: "Create Post",
      scheduledPosts: "Scheduled Posts",
      contentAutomation: "Content Automation"
    },
    login: {
      title: "Login",
      description:
        "Use any email and password. If the account does not exist yet, the app creates it automatically for this review demo.",
      email: "Email",
      password: "Password",
      emailPlaceholder: "reviewer@example.com",
      passwordPlaceholder: "minimum 6 characters",
      submit: "Login",
      submitting: "Signing in...",
      continueError: "Unable to continue."
    },
    dashboard: {
      eyebrow: "Dashboard",
      title: "Instagram publishing workspace",
      description: (email) =>
        `Logged in as ${email}. Connect the Instagram account, generate content with AI, preview it, and publish or schedule it for your Meta review flow.`,
      logout: "Logout",
      connectedSuccess: "Instagram account connected successfully.",
      publishedSuccess: "Post published successfully.",
      connectionStatus: "Connection status",
      scheduledPosts: "Scheduled posts",
      publishedPosts: "Published posts",
      noAccountTitle: "No account connected yet",
      noAccountDescription:
        "Connect an Instagram Professional account to unlock AI post generation and publishing.",
      connectInstagram: "Connect Instagram",
      quickActions: "Quick actions",
      createPost: "Create Post",
      viewScheduledPosts: "View Scheduled Posts",
      connectedAccount: "Connected Instagram Account"
    },
    connectInstagram: {
      eyebrow: "Instagram OAuth",
      title: "Connect Instagram Account",
      description:
        "Authorize a professional Instagram account with instagram_business_basic and instagram_business_content_publish so the app can fetch profile data, render assets, and publish posts.",
      body:
        "When you click the button below, the app redirects to Instagram OAuth. After approval, the callback exchanges the code for an access token, fetches the profile, stores it securely on the server, and returns you to the dashboard.",
      button: "Connect Instagram Account"
    },
    createPost: {
      eyebrow: "AI Generator",
      title: "Create Instagram Post",
      description:
        "Generate a caption, hashtags, and a 1080x1080 visual layout with Ollama Cloud. Preview it, edit the copy, optionally replace the image, then publish or schedule it."
    },
    generator: {
      contentTab: "Content",
      settingsTab: "Settings",
      topic: "Product or topic",
      topicPlaceholder: "Spring skincare launch",
      message: "Promotion or message",
      messagePlaceholder:
        "Promote the limited-time launch offer and highlight natural ingredients.",
      postType: "Post type",
      postTypeFeed: "Feed",
      postTypeStory: "Story",
      postTypeCarousel: "Carousel",
      carouselSlides: "Carousel planning",
      carouselSlidesDescription: "Choose how many slides to generate and optionally describe the purpose of each one. If left blank, AI will infer the narrative.",
      carouselSlidesCount: "Number of slides",
      carouselSlideContextLabel: "Slide context",
      carouselSlideContextPlaceholder: "Optional. Example: social proof, feature highlight, pricing, CTA.",
      carouselDefaultStructure: "Default carousel structure",
      carouselDefaultStructureDescription: "1 Hook cover, 2 problem/context, middle slides for value, penultimate slide for insight, final slide for CTA. You can edit any of these contexts.",
      restoreCarouselStructure: "Restore carousel structure",
      storyMode: "Story format",
      storyModeImageOnly: "Image only",
      storyModeWithCaption: "Image + caption",
      storyModeDescription: "Choose whether this story should be published only as an image or keep a caption in your workflow.",
      tone: "Tone",
      toneProfessional: "Professional",
      toneCasual: "Casual",
      tonePromotional: "Promotional",
      outputLanguage: "Output language",
      outputLanguageDescription: "Choose the language used in the caption and in the text rendered inside the generated post image.",
      outputLanguageEnglish: "English",
      outputLanguagePtBR: "Portuguese (Brazil)",
      customInstructions: "Prompt formula",
      customInstructionsDescription: "Customize the base instruction sent to the AI. You can keep the default formula or rewrite it to match your brand voice.",
      customInstructionsPlaceholder: "You are an expert Instagram content strategist and visual designer.",
      restoreDefaultInstructions: "Restore default formula",
      settingsSaved: "Settings saved successfully.",
      settingsSaveError: "Unable to save settings.",
      removeMedia: "Remove",
      carouselCount: "Carousel items",
      brandColors: "Brand colors",
      keywords: "Optional keywords",
      keywordsPlaceholder: "clean beauty, launch, limited offer",
      generate: "Generate Post",
      generating: "Generating...",
      generationProgress: "Generating your post",
      generationEstimate: "This usually takes up to a few minutes while AI writes and renders the image.",
      generationElapsed: "Elapsed",
      generationSlow: "Still working. If it gets close to the limit, we will surface a timeout instead of silently hanging.",
      editCaption: "Edit caption",
      publishNow: "Publish Now",
      publishing: "Publishing...",
      saveSchedule: "Save Schedule",
      scheduleTimeRequired: "Choose a schedule time before saving.",
      generateError: "Unable to generate post.",
      publishError: "Unable to publish.",
      scheduleError: "Unable to schedule."
    },
    upload: {
      title: "Upload custom image",
      description: "Uploading an image overrides the AI-generated preview for publishing.",
      carouselTitle: "Upload carousel images",
      carouselDescription:
        "Add between 2 and 10 images. The generated image can be the first slide, and the extra uploads will complete the carousel.",
      markAsAiGenerated: "Mark uploaded images as AI-generated",
      markAsAiGeneratedDescription:
        "Use this if the uploaded images were also created with AI and should carry the same metadata marker.",
      uploading: "Uploading...",
      error: "Upload failed."
    },
    preview: {
      imageAlt: "Generated post preview",
      empty: "Generate a post to preview it here",
      noCaption: "No caption yet.",
      previous: "Previous",
      next: "Next"
    },
    scheduler: {
      label: "Schedule time"
    },
    instagramCard: {
      title: "Connected Instagram Account",
      username: "Username",
      instagramId: "Instagram ID",
      connectionStatus: "Connection Status"
    },
    scheduledPage: {
      eyebrow: "Queue",
      title: "Scheduled Posts",
      description:
        "Track content waiting to be published as well as already-posted items for your review walkthrough.",
      savedSuccess: "Scheduled post saved successfully.",
      preview: "Preview",
      caption: "Caption",
      scheduledTime: "Scheduled time",
      status: "Status",
      noPosts: "No scheduled or published posts yet.",
      previewAlt: "Post preview"
    },
    contentAutomation: {
      eyebrow: "Automation",
      title: "Weekly content automation",
      description:
        "Adjust the brand briefing, weekly editorial logic, and topic research used by the AI agent that plans your Instagram content every Sunday.",
      brandName: "Brand name",
      editableBrief: "Editable briefing",
      automationLoopEnabled: "Keep weekly loop active",
      automationLoopDescription:
        "When enabled, the system automatically generates the next weekly agenda on Sunday if the upcoming week has not been generated yet.",
      services: "Services",
      contentRules: "Content rules",
      researchQueries: "Research queries",
      carouselDefaultStructure: "Default carousel structure",
      listHint: "Use one line per item in the lists above and below.",
      howItWorksTitle: "How this automation works",
      howItWorksDescription:
        "The agent uses this configuration as its operating brief. You can keep the default EcomForge positioning or rewrite everything to match another business. Repetition control now uses a compact topics history instead of storing full posts.",
      scheduleLabel: "Weekly schedule",
      scheduleDescription:
        "Every Sunday the system researches current topics, checks the last 60 days of history, and generates the next Monday-to-Friday plan.",
      weeklyAgendaTitle: "Weekly agenda rules",
      weeklyAgendaDescription:
        "Define the goal, content angles, and preferred formats for each weekday. The AI will follow this structure when building the next weekly plan.",
      dayGoal: "Goal",
      dayTypes: "Content types",
      dayFormats: "Formats",
      saveButton: "Save settings",
      saving: "Saving...",
      saveSuccess: "Content automation settings saved successfully.",
      saveError: "Unable to save content automation settings.",
      generateButton: "Generate weekly agenda now",
      generating: "Generating...",
      generateHint:
        "When you generate now, the system saves this configuration first and then creates a fresh weekly agenda with current topics.",
      generateSuccess: "Weekly content agenda generated successfully.",
      generateError: "Unable to generate the weekly content agenda.",
      currentTopics: "Current topics found",
      topicsHistoryTitle: "Topic history",
      topicsHistoryDescription:
        "This compact history is what the automation uses to avoid repeating the same subjects in future agendas.",
      clearTopicsHistory: "Clear topic history",
      clearTopicsHistorySuccess: "Topic history cleared successfully.",
      clearTopicsHistoryError: "Unable to clear the topic history.",
      noTopicsHistory: "No topic history saved yet.",
      generatedAgendaTitle: "Generated weekly agenda",
      generatedAgendaDescription:
        "Review the plan that will feed your content creation workflow, including structure, caption, visual idea, and CTA.",
      noAgenda: "No weekly agenda has been generated yet.",
      structure: "Structure",
      visualIdea: "Visual idea"
    }
  },
  "pt-BR": {
    common: {
      appName: "Publicador com IA",
      reviewDemo: "Demo de Revisao do Instagram",
      preview: "Previa",
      caption: "Legenda",
      status: "Status",
      connected: "Conectado",
      notConnected: "Nao conectado",
      pending: "Pendente",
      save: "Salvar"
    },
    language: {
      label: "Idioma",
      en: "Ingles",
      ptBR: "Portugues (Brasil)"
    },
    sidebar: {
      dashboard: "Painel",
      connectInstagram: "Conectar Instagram",
      createPost: "Criar Post",
      scheduledPosts: "Posts Agendados",
      contentAutomation: "Automacao de Conteudo"
    },
    login: {
      title: "Entrar",
      description:
        "Use qualquer email e senha. Se a conta ainda nao existir, o app a cria automaticamente para esta demo de revisao.",
      email: "Email",
      password: "Senha",
      emailPlaceholder: "revisor@exemplo.com",
      passwordPlaceholder: "minimo de 6 caracteres",
      submit: "Entrar",
      submitting: "Entrando...",
      continueError: "Nao foi possivel continuar."
    },
    dashboard: {
      eyebrow: "Painel",
      title: "Workspace de publicacao no Instagram",
      description: (email) =>
        `Conectado como ${email}. Conecte a conta do Instagram, gere conteudo com IA, visualize a previa e publique ou agende para o fluxo de revisao da Meta.`,
      logout: "Sair",
      connectedSuccess: "Conta do Instagram conectada com sucesso.",
      publishedSuccess: "Post publicado com sucesso.",
      connectionStatus: "Status da conexao",
      scheduledPosts: "Posts agendados",
      publishedPosts: "Posts publicados",
      noAccountTitle: "Nenhuma conta conectada ainda",
      noAccountDescription:
        "Conecte uma conta profissional do Instagram para liberar a geracao e publicacao com IA.",
      connectInstagram: "Conectar Instagram",
      quickActions: "Acoes rapidas",
      createPost: "Criar Post",
      viewScheduledPosts: "Ver Posts Agendados",
      connectedAccount: "Conta do Instagram conectada"
    },
    connectInstagram: {
      eyebrow: "OAuth do Instagram",
      title: "Conectar conta do Instagram",
      description:
        "Autorize uma conta profissional do Instagram com instagram_business_basic e instagram_business_content_publish para que o app possa buscar dados do perfil, renderizar assets e publicar posts.",
      body:
        "Quando voce clicar no botao abaixo, o app redireciona para o OAuth do Instagram. Apos a aprovacao, o callback troca o codigo por um token de acesso, busca o perfil, armazena tudo com seguranca no servidor e retorna voce ao painel.",
      button: "Conectar conta do Instagram"
    },
    createPost: {
      eyebrow: "Gerador com IA",
      title: "Criar post do Instagram",
      description:
        "Gere legenda, hashtags e um layout visual 1080x1080 com Ollama Cloud. Veja a previa, edite o texto, substitua a imagem se quiser, e depois publique ou agende."
    },
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
      customInstructions: "Formula do prompt",
      customInstructionsDescription: "Personalize a instrucao base enviada para a IA. Voce pode manter a formula padrao ou reescrever para combinar com a voz da sua marca.",
      customInstructionsPlaceholder: "Voce e um especialista em estrategia de conteudo para Instagram e design visual.",
      restoreDefaultInstructions: "Restaurar formula padrao",
      settingsSaved: "Configuracoes salvas com sucesso.",
      settingsSaveError: "Nao foi possivel salvar as configuracoes.",
      removeMedia: "Remover",
      carouselCount: "Itens do carrossel",
      brandColors: "Cores da marca",
      keywords: "Palavras-chave opcionais",
      keywordsPlaceholder: "beleza limpa, lancamento, oferta limitada",
      generate: "Gerar Post",
      generating: "Gerando...",
      generationProgress: "Gerando seu post",
      generationEstimate: "Isso pode levar alguns minutos enquanto a IA escreve e renderiza a imagem.",
      generationElapsed: "Tempo decorrido",
      generationSlow: "Ainda estamos processando. Se chegar perto do limite, vamos mostrar timeout em vez de parecer travado.",
      editCaption: "Editar legenda",
      publishNow: "Publicar agora",
      publishing: "Publicando...",
      saveSchedule: "Salvar agendamento",
      scheduleTimeRequired: "Escolha um horario antes de salvar.",
      generateError: "Nao foi possivel gerar o post.",
      publishError: "Nao foi possivel publicar.",
      scheduleError: "Nao foi possivel agendar."
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
      next: "Proximo"
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
    scheduledPage: {
      eyebrow: "Fila",
      title: "Posts agendados",
      description:
        "Acompanhe o conteudo aguardando publicacao, assim como os itens ja publicados, para o seu roteiro de revisao.",
      savedSuccess: "Post agendado salvo com sucesso.",
      preview: "Previa",
      caption: "Legenda",
      scheduledTime: "Horario agendado",
      status: "Status",
      noPosts: "Ainda nao ha posts agendados ou publicados.",
      previewAlt: "Previa do post"
    },
    contentAutomation: {
      eyebrow: "Automacao",
      title: "Automacao semanal de conteudo",
      description:
        "Ajuste o briefing da marca, a logica editorial da semana e as pesquisas de temas usadas pelo agente de IA que planeja seus conteudos de Instagram todo domingo.",
      brandName: "Nome da marca",
      editableBrief: "Briefing editavel",
      automationLoopEnabled: "Manter loop semanal ativo",
      automationLoopDescription:
        "Quando ativado, o sistema gera automaticamente a proxima agenda semanal no domingo se a semana seguinte ainda nao tiver sido gerada.",
      services: "Servicos",
      contentRules: "Regras de conteudo",
      researchQueries: "Consultas de pesquisa",
      carouselDefaultStructure: "Estrutura padrao de carrossel",
      listHint: "Use uma linha por item nas listas acima e abaixo.",
      howItWorksTitle: "Como essa automacao funciona",
      howItWorksDescription:
        "O agente usa esta configuracao como briefing operacional. Voce pode manter o posicionamento padrao da EcomForge ou reescrever tudo para outra empresa. O controle de repeticao agora usa um historico compacto de temas em vez de salvar posts completos.",
      scheduleLabel: "Agenda semanal",
      scheduleDescription:
        "Todo domingo o sistema pesquisa temas atuais, verifica o historico dos ultimos 60 dias e gera o planejamento de segunda a sexta.",
      weeklyAgendaTitle: "Regras da agenda semanal",
      weeklyAgendaDescription:
        "Defina o objetivo, os angulos de conteudo e os formatos preferidos de cada dia da semana. A IA segue essa estrutura ao montar o proximo planejamento.",
      dayGoal: "Objetivo",
      dayTypes: "Tipos de conteudo",
      dayFormats: "Formatos",
      saveButton: "Salvar configuracoes",
      saving: "Salvando...",
      saveSuccess: "Configuracoes da automacao salvas com sucesso.",
      saveError: "Nao foi possivel salvar as configuracoes da automacao.",
      generateButton: "Gerar agenda semanal agora",
      generating: "Gerando...",
      generateHint:
        "Ao gerar agora, o sistema salva primeiro esta configuracao e depois monta uma agenda nova com temas atuais.",
      generateSuccess: "Agenda semanal gerada com sucesso.",
      generateError: "Nao foi possivel gerar a agenda semanal.",
      currentTopics: "Temas atuais encontrados",
      topicsHistoryTitle: "Historico de temas",
      topicsHistoryDescription:
        "Este historico compacto e o que a automacao usa para evitar repetir os mesmos assuntos nas proximas agendas.",
      clearTopicsHistory: "Limpar historico de temas",
      clearTopicsHistorySuccess: "Historico de temas limpo com sucesso.",
      clearTopicsHistoryError: "Nao foi possivel limpar o historico de temas.",
      noTopicsHistory: "Ainda nao existe historico de temas salvo.",
      generatedAgendaTitle: "Agenda semanal gerada",
      generatedAgendaDescription:
        "Revise o planejamento que vai alimentar seu fluxo de criacao, incluindo estrutura, legenda, ideia visual e CTA.",
      noAgenda: "Ainda nao existe uma agenda semanal gerada.",
      structure: "Estrutura",
      visualIdea: "Ideia visual"
    }
  }
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
