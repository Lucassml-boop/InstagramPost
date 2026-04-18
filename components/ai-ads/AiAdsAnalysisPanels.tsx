"use client";

import type { AiAdsAnalysisResult } from "@/lib/ai-ads";
import { Panel } from "@/components/shared";
import { CampaignDecisionCard } from "./CampaignDecisionCard";
import { formatCurrency, formatPct, renderActionLabel } from "./format";
import { MetricCard } from "./MetricCard";

export function AiAdsAnalysisPanels({ analysis }: { analysis: AiAdsAnalysisResult | null }) {
  return (
    <>
      <div className="space-y-6">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Guardrails ativos</p></div>
          <div className="space-y-3 p-6 text-sm text-slate-700">
            <p>Nunca aumenta verba acima de 30% em um unico ciclo.</p>
            <p>Nunca pausa campanha nova antes de 3 dias.</p>
            <p>Nunca pausa automaticamente campanhas com alto volume de conversao.</p>
            <p>Cada lote sincronizado vira snapshot e memoria operacional.</p>
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Camadas analisadas</p></div>
          <div className="grid gap-3 p-6 text-sm text-slate-700">
            <p>Performance basica: CTR, CPA, ROAS, conversoes e frequencia.</p>
            <p>Estrutura: publico vencedor, publico fraco e gargalos de criativo.</p>
            <p>Contexto de negocio: margem, ticket medio, estoque e sazonalidade.</p>
            <p>Comportamento no tempo: tendencia contra o periodo anterior.</p>
          </div>
        </Panel>

        {analysis ? <PortfolioSummary analysis={analysis} /> : null}
      </div>

      {analysis ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Insights do portfolio</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">{analysis.portfolioInsights.map((item) => <p key={item}>{item}</p>)}</div>
            </Panel>
            <Panel className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fila de execucao</p>
              <div className="mt-4 space-y-3">
                {analysis.executionPlan.map((item) => (
                  <div key={`${item.campaignId}-${item.action}-${item.reason}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{item.campaignName} - {renderActionLabel(item.action)}{typeof item.approvedChangePct === "number" ? ` (${formatPct(item.approvedChangePct)})` : ""}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div className="space-y-6">{analysis.decisions.map((decision) => <CampaignDecisionCard key={decision.campaignId} decision={decision} />)}</div>
          <BottomPanels analysis={analysis} />
        </>
      ) : null}
    </>
  );
}

function PortfolioSummary({ analysis }: { analysis: AiAdsAnalysisResult }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Resumo do portfolio</p>
        <p className="mt-2 text-sm text-slate-600">{analysis.objective}</p>
      </div>
      <div className="grid gap-3 p-6 sm:grid-cols-2">
        <MetricCard label="Spend total" value={formatCurrency(analysis.summary.totalSpend)} />
        <MetricCard label="Lucro estimado" value={formatCurrency(analysis.summary.estimatedProfit)} accent={analysis.summary.estimatedProfit > 0} />
        <MetricCard label="Receita total" value={formatCurrency(analysis.summary.totalRevenue)} />
        <MetricCard label="Bloqueios" value={analysis.summary.blockedActions} />
      </div>
    </Panel>
  );
}

function BottomPanels({ analysis }: { analysis: AiAdsAnalysisResult }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Monitoramento de impacto</p>
        <div className="mt-4 space-y-3 text-sm text-slate-700">{analysis.monitoringPlan.map((item) => <p key={item}>{item}</p>)}</div>
      </Panel>
      <Panel className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Aprendizado continuo</p>
        <div className="mt-4 space-y-3 text-sm text-slate-700">{analysis.learningLoop.map((item) => <p key={item}>{item}</p>)}</div>
      </Panel>
    </div>
  );
}
