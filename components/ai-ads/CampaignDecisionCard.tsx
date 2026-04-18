"use client";

import type { AiAdsCampaignDecision } from "@/lib/ai-ads";
import { Panel } from "@/components/shared";
import { formatCurrency, formatPct, getHealthClasses, renderActionLabel } from "./format";
import { MetricCard } from "./MetricCard";

export function CampaignDecisionCard({ decision }: { decision: AiAdsCampaignDecision }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {decision.campaignId}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{decision.campaignName}</h3>
            <p className="mt-2 text-sm text-slate-600">{decision.summary}</p>
          </div>
          <span
            className={`inline-flex h-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getHealthClasses(decision.health)}`}
          >
            {decision.health}
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Spend" value={formatCurrency(decision.metrics.spend)} />
            <MetricCard label="Lucro Est." value={formatCurrency(decision.metrics.estimatedProfit)} accent={decision.metrics.estimatedProfit > 0} />
            <MetricCard label="CPA" value={decision.metrics.cpa === null ? "-" : formatCurrency(decision.metrics.cpa)} />
            <MetricCard label="ROAS" value={decision.metrics.roas ?? "-"} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Achados</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {decision.findings.map((finding) => <p key={`${decision.campaignId}-${finding}`}>{finding}</p>)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Sinais de negocio</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>Margem: {decision.businessSignals.marginPct.toFixed(1)}%</p>
                <p>Fadiga criativa: {decision.businessSignals.creativeFatigueRisk}</p>
                <p>Melhor publico: {decision.businessSignals.bestAudience ?? "-"}</p>
                <p>Pior publico: {decision.businessSignals.weakestAudience ?? "-"}</p>
                <p>Estoque: {decision.businessSignals.stockLevel ?? "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ActionBox title="Acoes aprovadas" tone="emerald">
            {decision.approvedActions.map((action) => (
              <div key={`${decision.campaignId}-${action.type}-${action.reason}`}>
                <p className="text-sm font-semibold text-emerald-900">
                  {renderActionLabel(action.type)}
                  {typeof action.approvedChangePct === "number" ? ` - ${formatPct(action.approvedChangePct)}` : ""}
                </p>
                <p className="mt-1 text-sm text-emerald-800">{action.reason}</p>
              </div>
            ))}
          </ActionBox>

          <ActionBox title="Acoes bloqueadas" tone="red">
            {decision.blockedActions.length === 0 ? (
              <p className="text-sm text-red-800">Nenhum bloqueio neste ciclo.</p>
            ) : (
              decision.blockedActions.map((action) => (
                <div key={`${decision.campaignId}-${action.type}-${action.reason}`}>
                  <p className="text-sm font-semibold text-red-900">{renderActionLabel(action.type)}</p>
                  <p className="mt-1 text-sm text-red-800">{action.safetyReason}</p>
                </div>
              ))
            )}
          </ActionBox>

          <Panel className="border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Monitorar agora</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {decision.watchItems.length === 0 ? <p>Sem alertas extras de monitoramento.</p> : decision.watchItems.map((item) => <p key={`${decision.campaignId}-${item}`}>{item}</p>)}
            </div>
          </Panel>
        </div>
      </div>
    </Panel>
  );
}

function ActionBox({
  title,
  tone,
  children
}: {
  title: string;
  tone: "emerald" | "red";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-red-700";

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
