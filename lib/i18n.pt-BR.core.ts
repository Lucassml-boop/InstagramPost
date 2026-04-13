import type { Dictionary } from "./i18n.en.ts";

export const ptBRCoreDictionary: Pick<Dictionary, 'common' | 'language' | 'sidebar'> = {
common: {
  appName: "Publicador com IA",
  reviewDemo: "Demo de Revisao do Instagram",
  preview: "Previa",
  caption: "Legenda",
  status: "Status",
  connected: "Conectado",
  notConnected: "Nao conectado",
  pending: "Pendente",
  save: "Salvar",
  serverConnectionError:
    "Nao foi possivel conectar ao servidor do app. Verifique se o npm run dev continua ativo e tente novamente."
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
  contentAutomation: "Automacao de Conteudo",
  automationDiagnostics: "Diagnostico das Automacoes"
},
};
