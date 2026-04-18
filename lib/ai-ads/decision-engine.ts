import { enrichCampaign, round, type EnrichedCampaign } from "./engine-utils.ts";
import type {
  AiAdsAction,
  AiAdsAnalysisInput,
  AiAdsAnalysisResult,
  AiAdsCampaignDecision,
  ParsedCampaign
} from "./schema.ts";
import { aiAdsAnalysisInputSchema } from "./schema.ts";

function buildCandidateActions(enriched: EnrichedCampaign, input: AiAdsAnalysisInput) {
  const actions: Omit<AiAdsAction, "status">[] = [];
  const findings: string[] = [];
  const watchItems: string[] = [];
  const { campaign, cpa, roas, breakEvenRoas } = enriched;

  if (campaign.daysActive < input.safetyRules.newCampaignFreezeDays) {
    findings.push(`Campanha ainda em fase inicial com ${campaign.daysActive} dia(s) ativos.`);
    actions.push(
      enriched.needsCreativeHelp
        ? { type: "test_new_creative", reason: "CTR fraco no inicio; testar criativo primeiro." }
        : { type: "keep_running", reason: "Campanha nova demais para ajuste de verba." }
    );
    watchItems.push("Revisar novamente quando a campanha completar pelo menos 3 dias.");
    return { actions, findings, watchItems };
  }

  if (enriched.lowStock) {
    findings.push("Estoque baixo detectado; crescimento agressivo pode gerar atrito operacional.");
    actions.push({
      type: "decrease_budget",
      requestedChangePct: 10,
      reason: "Preservar entrega enquanto o estoque esta pressionado."
    });
    watchItems.push("Confirmar reposicao de estoque antes de escalar novamente.");
  }

  if (enriched.goodScaleCandidate) {
    findings.push("Campanha rentavel, com bom volume e sinal de escala.");
    actions.push({
      type: "increase_budget",
      requestedChangePct: campaign.trend === "rising" ? 20 : 15,
      reason: "CPA dentro da meta e ROAS acima do break-even com lucro positivo."
    });

    if (campaign.frequency <= 2.5 && typeof roas === "number" && roas >= input.businessContext.targetRoas * 1.35) {
      actions.push({
        type: "duplicate_campaign",
        reason: "Criar variante controlada para escalar sem contaminar a vencedora."
      });
    }
  }

  if (campaign.audiences.length >= 2 && enriched.bestAudience && enriched.weakestAudience) {
    const gap = (enriched.bestAudience.roas ?? 0) - (enriched.weakestAudience.roas ?? 0);
    if (gap >= 1) {
      findings.push(`Ha diferenca relevante entre audiencias: ${enriched.bestAudience.name} performa melhor.`);
      actions.push({
        type: "reallocate_budget",
        requestedChangePct: 15,
        reason: `Mover verba da audiencia ${enriched.weakestAudience.name} para ${enriched.bestAudience.name}.`
      });
    }
  }

  if (enriched.needsCreativeHelp) {
    findings.push("Baixo sinal de clique ou fadiga criativa detectada.");
    actions.push({ type: "test_new_creative", reason: "O problema principal parece estar no criativo." });
  }

  if (enriched.highRisk && campaign.conversions === 0 && campaign.spend >= input.businessContext.targetCpa * 3) {
    findings.push("A campanha consumiu verba suficiente e ainda nao gerou conversoes.");
    actions.push({ type: "pause", reason: "Corte de prejuizo por falta total de retorno apos gasto relevante." });
  } else if (enriched.highRisk) {
    findings.push("Lucro estimado negativo ou CPA muito acima da meta.");
    if (typeof cpa === "number" && cpa >= input.businessContext.targetCpa * 1.9) {
      actions.push({ type: "pause", reason: "Desempenho severamente ineficiente; pausar se guardrails permitirem." });
    }
    actions.push({ type: "decrease_budget", requestedChangePct: 20, reason: "Reduzir risco enquanto novas hipoteses sao testadas." });
  }

  if (typeof cpa === "number" && cpa > input.businessContext.targetCpa && campaign.conversions > 0 && campaign.conversions < input.businessContext.minimumConversionsForScaling && !enriched.needsCreativeHelp) {
    findings.push("CPA acima da meta, mas com pouco volume para conclusao definitiva.");
    watchItems.push("Coletar mais algumas conversoes antes de pausar ou duplicar.");
  }

  if (campaign.frequency >= 3 && campaign.trend === "falling") watchItems.push("Monitorar frequencia e queda de CTR nas proximas 48 horas.");
  if (typeof breakEvenRoas === "number" && typeof roas === "number" && roas < breakEvenRoas) findings.push("Mesmo com ROAS positivo, a margem atual ainda nao cobre o break-even real.");
  if (findings.length === 0) findings.push("Sem alertas criticos; campanha pede acompanhamento disciplinado.");
  if (actions.length === 0) actions.push({ type: "keep_running", reason: "Nenhuma mudanca forte recomendada neste ciclo." });

  return { actions, findings, watchItems };
}

function applySafetyRules(campaign: ParsedCampaign, actions: Omit<AiAdsAction, "status">[], input: AiAdsAnalysisInput) {
  const approvedActions: AiAdsAction[] = [];
  const blockedActions: AiAdsAction[] = [];

  for (const action of actions) {
    const isBlockedNewCampaign =
      campaign.daysActive < input.safetyRules.newCampaignFreezeDays &&
      ["pause", "increase_budget", "decrease_budget", "reallocate_budget", "duplicate_campaign"].includes(action.type);

    if (isBlockedNewCampaign) {
      blockedActions.push({ ...action, status: "blocked", safetyReason: "Campanhas novas ficam congeladas para alteracoes de verba e estrutura." });
      continue;
    }

    if (action.type === "pause" && campaign.conversions >= input.safetyRules.neverPauseAboveConversions) {
      blockedActions.push({ ...action, status: "blocked", safetyReason: "Campanhas com alto volume de conversao exigem revisao humana antes de pausa total." });
      continue;
    }

    if (action.type === "increase_budget" && typeof action.requestedChangePct === "number") {
      approvedActions.push({ ...action, status: "approved", approvedChangePct: Math.min(action.requestedChangePct, input.safetyRules.maxBudgetIncreasePct) });
      continue;
    }

    if (["decrease_budget", "reallocate_budget"].includes(action.type) && typeof action.requestedChangePct === "number") {
      approvedActions.push({ ...action, status: "approved", approvedChangePct: round(action.requestedChangePct) });
      continue;
    }

    approvedActions.push({ ...action, status: action.type === "keep_running" ? "watch" : "approved" });
  }

  return { approvedActions, blockedActions };
}

function getDecisionHealth(decision: { approvedActions: AiAdsAction[]; blockedActions: AiAdsAction[]; estimatedProfit: number; }) {
  if (decision.approvedActions.some((a) => ["pause", "decrease_budget"].includes(a.type)) || (decision.estimatedProfit < 0 && decision.approvedActions.some((a) => a.type !== "keep_running"))) return "risk" as const;
  if (decision.approvedActions.some((a) => ["increase_budget", "duplicate_campaign"].includes(a.type))) return "scale" as const;
  if (decision.approvedActions.some((a) => ["reallocate_budget", "test_new_creative"].includes(a.type)) || decision.blockedActions.length > 0) return "optimize" as const;
  return "watch" as const;
}

function getCampaignSummary(health: AiAdsCampaignDecision["health"], approvedActions: AiAdsAction[], blockedActions: AiAdsAction[]) {
  if (health === "scale") return "Campanha com sinal de escala controlada.";
  if (health === "risk") return "Campanha pede corte de risco e revisao rapida.";
  if (health === "optimize") return blockedActions.length > 0 ? "Campanha tem ajustes sugeridos, mas parte deles exige revisao humana." : "Campanha pede otimizacao taticamente orientada.";
  return approvedActions.some((action) => action.type === "keep_running") ? "Campanha deve seguir coletando dados antes de uma intervencao maior." : "Campanha sob monitoramento.";
}

export function analyzeAiAdsInput(rawInput: unknown): AiAdsAnalysisResult {
  const input = aiAdsAnalysisInputSchema.parse(rawInput);
  const decisions = input.campaigns.map((campaign) => {
    const enriched = enrichCampaign(campaign, input);
    const candidates = buildCandidateActions(enriched, input);
    const safety = applySafetyRules(campaign, candidates.actions, input);
    const health = getDecisionHealth({ approvedActions: safety.approvedActions, blockedActions: safety.blockedActions, estimatedProfit: enriched.estimatedProfit });

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      health,
      summary: getCampaignSummary(health, safety.approvedActions, safety.blockedActions),
      findings: candidates.findings,
      metrics: { spend: round(campaign.spend), conversions: campaign.conversions, ctr: round(campaign.ctr), cpa: enriched.cpa === null ? null : round(enriched.cpa), roas: enriched.roas, revenue: enriched.revenue, estimatedProfit: enriched.estimatedProfit, breakEvenRoas: enriched.breakEvenRoas, frequency: round(campaign.frequency) },
      businessSignals: { marginPct: round(campaign.profitMargin * 100, 1), seasonality: campaign.seasonality, stockLevel: campaign.stockLevel ?? null, creativeFatigueRisk: enriched.creativeFatigueRisk, bestAudience: enriched.bestAudience?.name ?? null, weakestAudience: enriched.weakestAudience?.name ?? null },
      approvedActions: safety.approvedActions,
      blockedActions: safety.blockedActions,
      watchItems: candidates.watchItems
    } satisfies AiAdsCampaignDecision;
  });

  const totalSpend = round(decisions.reduce((sum, item) => sum + item.metrics.spend, 0));
  const totalRevenue = round(decisions.reduce((sum, item) => sum + item.metrics.revenue, 0));
  const estimatedProfit = round(decisions.reduce((sum, item) => sum + item.metrics.estimatedProfit, 0));
  const blockedActions = decisions.reduce((sum, item) => sum + item.blockedActions.length, 0);
  const executionPlan = decisions.flatMap((decision) => decision.approvedActions.filter((action) => action.status === "approved").map((action) => ({ campaignId: decision.campaignId, campaignName: decision.campaignName, action: action.type, approvedChangePct: action.approvedChangePct, mode: input.executionMode, reason: action.reason })));
  const topProfitCampaign = [...decisions].sort((left, right) => right.metrics.estimatedProfit - left.metrics.estimatedProfit)[0];
  const topRiskCampaign = [...decisions].sort((left, right) => left.metrics.estimatedProfit - right.metrics.estimatedProfit)[0];

  return {
    generatedAt: new Date().toISOString(),
    objective: input.objective,
    executionMode: input.executionMode,
    summary: { totalSpend, totalRevenue, estimatedProfit, campaignsAnalyzed: decisions.length, scaleCount: decisions.filter((item) => item.health === "scale").length, optimizeCount: decisions.filter((item) => item.health === "optimize").length, riskCount: decisions.filter((item) => item.health === "risk").length, blockedActions },
    workflow: ["Coletar dados das APIs de Ads e historico recente.", "Enriquecer com margem, ticket, estoque e objetivo de negocio.", "Classificar saude por lucro, eficiencia e tendencia.", "Gerar acoes taticas por campanha, publico e criativo.", "Aplicar guardrails antes de qualquer execucao.", "Executar apenas a fila aprovada ou mandar para revisao humana.", "Monitorar impacto em CPA, ROAS, lucro e saturacao.", "Persistir historico para aprender quais decisoes funcionaram."],
    portfolioInsights: [topProfitCampaign ? `${topProfitCampaign.campaignName} e hoje a campanha com melhor lucro estimado.` : "Nenhuma campanha com lucro positivo foi identificada.", topRiskCampaign ? `${topRiskCampaign.campaignName} concentra o maior risco financeiro atual.` : "Nenhuma campanha critica foi identificada.", blockedActions > 0 ? `${blockedActions} acao(oes) ficaram bloqueadas pelos guardrails de seguranca.` : "Nenhuma acao foi bloqueada pelos guardrails nesta rodada."],
    decisions,
    executionPlan,
    monitoringPlan: ["Comparar CPA, ROAS e lucro 24h, 72h e 7 dias apos cada ajuste.", "Acompanhar CTR e frequencia para validar fadiga de criativo.", "Monitorar redistribuicao por audiencia para confirmar ganho real, nao so ganho de volume.", "Registrar antes e depois de cada acao para criar memoria de aprendizado."],
    learningLoop: ["Salvar payload bruto, decisao recomendada e decisao executada.", "Guardar resultado posterior por campanha, audiencia e criativo.", "Identificar quais acoes geraram melhora real de lucro.", "Usar esse historico para calibrar limites, scoring e futuras previsoes."]
  };
}
