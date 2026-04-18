"use client";

import { Panel } from "@/components/shared";
import type { AiAdsDashboardData } from "@/lib/meta-ads";
import { AiAdsAnalysisPanels } from "./AiAdsAnalysisPanels";
import { AiAdsConnectionPanel } from "./AiAdsConnectionPanel";
import { AiAdsPayloadEditor } from "./AiAdsPayloadEditor";
import { MetricCard } from "./MetricCard";
import { useAiAdsWorkspace } from "./useAiAdsWorkspace";

export function AiAdsWorkspace({ initialData }: { initialData: AiAdsDashboardData | null }) {
  const state = useAiAdsWorkspace(initialData);

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.96),_rgba(15,23,42,0.88)_45%,_rgba(30,41,59,0.92))] p-0 text-white shadow-2xl">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">AI Ads Operating System</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight">Meta Ads + snapshots + memoria de decisoes dentro do mesmo workspace.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">Agora o cockpit aceita credenciais da conta de Ads, puxa campanhas reais da Meta, persiste snapshots no banco e reaproveita esse historico para gerar analise orientada a lucro.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Fluxo" value="coletar -> decidir" accent />
            <MetricCard label="Fonte" value="Meta Ads API" />
            <MetricCard label="Persistencia" value="Supabase Postgres" />
            <MetricCard label="Foco" value="lucro" />
          </div>
        </div>
      </Panel>

      {(state.error || state.infoMessage) && (
        <div className={state.error ? "rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"}>
          {state.error ?? state.infoMessage}
        </div>
      )}

      <AiAdsConnectionPanel {...state} />

      <div className="grid gap-4 lg:grid-cols-4">
        {["1. Coleta de dados", "2. Enriquecimento de negocio", "3. IA + regras + seguranca", "4. Execucao, monitoramento e memoria"].map((step) => (
          <Panel key={step} className="p-5"><p className="text-sm font-semibold text-ink">{step}</p></Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <AiAdsPayloadEditor payload={state.payload} setPayload={state.setPayload} isAnalyzing={state.isAnalyzing} analyzePayload={state.analyzePayload} loadSample={state.loadSample} />
        <AiAdsAnalysisPanels analysis={state.analysis} />
      </div>
    </div>
  );
}
