"use client";

import { Panel } from "@/components/shared";

export function AiAdsPayloadEditor({
  payload,
  setPayload,
  isAnalyzing,
  analyzePayload,
  loadSample
}: {
  payload: string;
  setPayload: (value: string) => void;
  isAnalyzing: boolean;
  analyzePayload: () => void;
  loadSample: () => void;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Payload estruturado
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          O payload abaixo pode vir da sincronizacao real da Meta ou de um sample manual.
          Ele continua editavel para testes e cenarios simulados.
        </p>
      </div>
      <div className="p-6">
        <textarea
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          spellCheck={false}
          className="min-h-[560px] w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-[13px] leading-6 text-slate-100 outline-none transition focus:border-slate-500"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={analyzePayload}
            disabled={isAnalyzing}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing ? "Analisando..." : "Executar analise"}
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
          >
            Carregar sample
          </button>
        </div>
      </div>
    </Panel>
  );
}
