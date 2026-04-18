"use client";

import { Panel } from "@/components/shared";
import { formatCurrency } from "./format";
import { MetricCard } from "./MetricCard";

type WorkspaceState = {
  account: { adAccountId: string; lastSyncedAt: string | null; targetCpa: number; targetRoas: number } | null;
  latestSync: { status: string; campaignsFetched: number; datePreset: string } | null;
  datePreset: string;
  adAccountId: string;
  accessToken: string;
  targetCpa: number;
  targetRoas: number;
  ticketAverage: number;
  profitMargin: number;
  stockLevel: string;
  seasonality: "high" | "normal" | "low";
  isAnalyzing: boolean;
  isSavingSettings: boolean;
  isSyncing: boolean;
  setDatePreset: (value: string) => void;
  setAdAccountId: (value: string) => void;
  setAccessToken: (value: string) => void;
  setTargetCpa: (value: number) => void;
  setTargetRoas: (value: number) => void;
  setTicketAverage: (value: number) => void;
  setProfitMargin: (value: number) => void;
  setStockLevel: (value: string) => void;
  setSeasonality: (value: "high" | "normal" | "low") => void;
  handleSaveSettings: () => void;
  refreshDashboard: () => void;
  handleSync: () => void;
};

export function AiAdsConnectionPanel(state: WorkspaceState) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Conexao Meta Ads</p>
          <p className="mt-2 text-sm text-slate-600">Use um token com `ads_read` ou `ads_management`. O ad account ID pode ser salvo como `act_123...` ou apenas o numero.</p>
        </div>
        <div className="grid gap-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Ad Account ID"><input value={state.adAccountId} onChange={(e) => state.setAdAccountId(e.target.value)} className={inputClass} placeholder="act_1234567890" /></Field>
            <Field label="Access token"><input value={state.accessToken} onChange={(e) => state.setAccessToken(e.target.value)} className={inputClass} placeholder={state.account ? "Preencha so quando quiser atualizar o token" : "EAAB..."} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <NumberField label="CPA alvo" value={state.targetCpa} onChange={state.setTargetCpa} min="1" step="0.01" />
            <NumberField label="ROAS alvo" value={state.targetRoas} onChange={state.setTargetRoas} min="0.1" step="0.1" />
            <NumberField label="Ticket medio" value={state.ticketAverage} onChange={state.setTicketAverage} min="1" step="0.01" />
            <NumberField label="Margem (%)" value={state.profitMargin} onChange={state.setProfitMargin} min="1" max="100" step="1" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Estoque base"><input type="number" min="0" step="1" value={state.stockLevel} onChange={(e) => state.setStockLevel(e.target.value)} className={inputClass} placeholder="Opcional" /></Field>
            <Field label="Sazonalidade">
              <select value={state.seasonality} onChange={(e) => state.setSeasonality(e.target.value as "high" | "normal" | "low")} className={inputClass}>
                <option value="high">Alta</option><option value="normal">Normal</option><option value="low">Baixa</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={state.handleSaveSettings} disabled={state.isSavingSettings}>{state.isSavingSettings ? "Salvando..." : "Salvar configuracao"}</PrimaryButton>
            <SecondaryButton onClick={state.refreshDashboard} disabled={state.isAnalyzing}>Recarregar dashboard</SecondaryButton>
          </div>
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Estado da conexao</p></div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <MetricCard label="Conta salva" value={state.account?.adAccountId ?? "nao configurada"} />
            <MetricCard label="Ultimo sync" value={state.account?.lastSyncedAt ? "feito" : "pendente"} />
            <MetricCard label="CPA alvo" value={state.account ? formatCurrency(state.account.targetCpa) : "-"} />
            <MetricCard label="ROAS alvo" value={state.account?.targetRoas ?? "-"} />
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Sincronizacao real</p>
            <p className="mt-2 text-sm text-slate-600">Busca campanhas da Meta, salva snapshots no banco e gera uma analise nova com base no lote sincronizado.</p>
          </div>
          <div className="space-y-4 p-6">
            <Field label="Janela de dados">
              <select value={state.datePreset} onChange={(e) => state.setDatePreset(e.target.value)} className={inputClass}>
                <option value="last_7d">Ultimos 7 dias</option><option value="last_14d">Ultimos 14 dias</option><option value="last_30d">Ultimos 30 dias</option>
              </select>
            </Field>
            <PrimaryButton onClick={state.handleSync} disabled={state.isSyncing || !state.account}>{state.isSyncing ? "Sincronizando..." : "Sincronizar Meta Ads agora"}</PrimaryButton>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p>Status: {state.latestSync?.status ?? "ainda nao sincronizado"}</p>
              <p>Campanhas no ultimo lote: {state.latestSync?.campaignsFetched ?? 0}</p>
              <p>Janela: {state.latestSync?.datePreset ?? "-"}</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-slate-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;
}

function NumberField({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (value: number) => void; min: string; max?: string; step: string; }) {
  return <Field label={label}><input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputClass} /></Field>;
}

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{children}</button>;
}

function SecondaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">{children}</button>;
}
