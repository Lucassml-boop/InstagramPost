import type { Dictionary } from "./i18n.en.ts";

export const ptBRWorkspaceDictionary: Pick<Dictionary, 'dashboard' | 'connectInstagram' | 'createPost'> = {
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
};
