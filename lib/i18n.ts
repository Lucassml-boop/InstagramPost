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
    uploading: string;
    error: string;
  };
  preview: {
    imageAlt: string;
    empty: string;
    noCaption: string;
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
      scheduledPosts: "Scheduled Posts"
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
      uploading: "Uploading...",
      error: "Upload failed."
    },
    preview: {
      imageAlt: "Generated post preview",
      empty: "Generate a post to preview it here",
      noCaption: "No caption yet."
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
      scheduledPosts: "Posts Agendados"
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
      uploading: "Enviando...",
      error: "Falha no upload."
    },
    preview: {
      imageAlt: "Previa do post gerado",
      empty: "Gere um post para visualizar a previa aqui",
      noCaption: "Ainda nao ha legenda."
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
    }
  }
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
