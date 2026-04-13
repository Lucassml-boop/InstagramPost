import type { Dictionary } from "./i18n.en.ts";

export const ptBRDiagnosticsDictionary: Pick<Dictionary, 'automationDiagnostics'> = {
automationDiagnostics: {
  eyebrow: "Diagnostico",
  title: "Diagnostico das automacoes",
  description:
    "Dispare os crons manualmente e inspecione a resposta em tempo real sem precisar esperar o horario agendado.",
  helpTitle: "Como usar esta pagina",
  helpDescription:
    "Cada acao abaixo dispara a mesma automacao de backend usada pelo scheduler. Rode uma por vez e revise o JSON retornado para confirmar se o fluxo esta se comportando corretamente.",
  generateWeeklyTitle: "Gerar agenda semanal de conteudo",
  generateWeeklyDescription:
    "Executa a automacao de planejamento semanal e mostra se a agenda foi gerada ou ignorada.",
  clearTopicsTitle: "Executar limpeza do historico de temas",
  clearTopicsDescription:
    "Executa a limpeza automatica do historico de temas usando a frequencia configurada nas configuracoes da automacao.",
  publishScheduledTitle: "Publicar posts agendados",
  publishScheduledDescription:
    "Processa os posts cujo horario ja chegou e tenta publicar imediatamente.",
  publishWeeklyPreviewTitle: "Publicar a agenda semanal inteira agora",
  publishWeeklyPreviewDescription:
    "Usa a agenda semanal atual para gerar e publicar cada item em sequencia, assim voce consegue verificar como a semana ficaria na pratica.",
  publishWeeklyPreviewDay: "Dia da agenda para publicar",
  publishWeeklyPreviewAllDays: "Publicar a semana inteira",
  refreshTokensTitle: "Atualizar tokens do Instagram",
  refreshTokensDescription:
    "Atualiza os tokens de acesso do Instagram das contas conectadas.",
  runAction: "Executar automacao",
  running: "Executando...",
  lastStatus: "Ultimo status",
  notRunYet: "Ainda nao executado",
  requestFailed: "A requisicao falhou.",
  summaryLabel: "Resumo:",
  weeklySkipped: "o plano semanal foi ignorado porque ja existe",
  cleanupSkipped: "a limpeza foi ignorada hoje",
  itemsGenerated: "itens gerados",
  itemsCleared: "temas limpos",
  itemsProcessed: "posts agendados processados",
  itemsPublished: "publicados",
  itemsFailed: "falharam",
  tokensRefreshed: "tokens atualizados",
  awaitingRun: "Execute esta automacao para ver um resumo humano aqui.",
  sectionRealtime: "Feedback em tempo real",
  sectionRealtimeDescription:
    "Cada acao retorna a resposta real do backend para que voce valide o status exato sem abrir o terminal.",
  sectionSafety: "Teste com seguranca",
  sectionSafetyDescription:
    "Use o seletor de dia na publicacao da agenda semanal se quiser disparar apenas um item em vez da semana inteira."
}
};
