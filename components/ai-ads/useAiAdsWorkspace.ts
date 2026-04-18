"use client";

import { useState, useTransition } from "react";
import { AI_ADS_SAMPLE_INPUT, type AiAdsAnalysisResult } from "@/lib/ai-ads";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import type { AiAdsDashboardData } from "@/lib/meta-ads";
import { analyzeAiAds, fetchAiAdsDashboard, saveMetaAdsSettings, syncMetaAds } from "@/services/frontend/ai-ads";

function getInitialPayload(initialData: AiAdsDashboardData | null) {
  return JSON.stringify(initialData?.payload ?? AI_ADS_SAMPLE_INPUT, null, 2);
}

export function useAiAdsWorkspace(initialData: AiAdsDashboardData | null) {
  const [payload, setPayload] = useState(() => getInitialPayload(initialData));
  const [analysis, setAnalysis] = useState<AiAdsAnalysisResult | null>(initialData?.analysis ?? null);
  const [account, setAccount] = useState<AiAdsDashboardData["account"]>(initialData?.account ?? null);
  const [latestSync, setLatestSync] = useState<AiAdsDashboardData["latestSync"]>(initialData?.latestSync ?? null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(initialData?.setupMessage ?? null);
  const [datePreset, setDatePreset] = useState(initialData?.latestSync?.datePreset ?? "last_7d");
  const [adAccountId, setAdAccountId] = useState(initialData?.account?.adAccountId ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [targetCpa, setTargetCpa] = useState(initialData?.account?.targetCpa ?? 40);
  const [targetRoas, setTargetRoas] = useState(initialData?.account?.targetRoas ?? 2.4);
  const [ticketAverage, setTicketAverage] = useState(initialData?.account?.ticketAverage ?? 150);
  const [profitMargin, setProfitMargin] = useState((initialData?.account?.profitMargin ?? 0.5) * 100);
  const [stockLevel, setStockLevel] = useState(initialData?.account?.stockLevel?.toString() ?? "");
  const [seasonality, setSeasonality] = useState<"high" | "normal" | "low">(initialData?.account?.seasonality ?? "normal");
  const [isAnalyzing, startAnalyzeTransition] = useTransition();
  const [isSavingSettings, startSettingsTransition] = useTransition();
  const [isSyncing, startSyncTransition] = useTransition();

  function hydrateDashboard(data: AiAdsDashboardData) {
    setAccount(data.account ?? null);
    setLatestSync(data.latestSync ?? null);
    setAnalysis(data.analysis ?? null);
    setInfoMessage(data.setupMessage ?? null);
    if (data.payload) setPayload(JSON.stringify(data.payload, null, 2));
    if (!data.account) return;
    setAdAccountId(data.account.adAccountId);
    setTargetCpa(data.account.targetCpa);
    setTargetRoas(data.account.targetRoas);
    setTicketAverage(data.account.ticketAverage);
    setProfitMargin(data.account.profitMargin * 100);
    setStockLevel(data.account.stockLevel?.toString() ?? "");
    setSeasonality(data.account.seasonality);
  }

  function setRequestError(requestError: unknown, fallback: string) {
    setError(getClientRequestErrorMessage(requestError, fallback, "Nao foi possivel se conectar ao servidor."));
  }

  const clearMessages = () => {
    setError(null);
    setInfoMessage(null);
  };

  const analyzePayload = () => startAnalyzeTransition(async () => {
    clearMessages();
    try {
      const response = await analyzeAiAds(JSON.parse(payload));
      if (!response.analysis) throw new Error("A analise nao retornou dados.");
      setAnalysis(response.analysis);
      setInfoMessage("Analise executada com sucesso.");
    } catch (requestError) {
      setAnalysis(null);
      setRequestError(requestError, "Nao foi possivel analisar o payload de AI Ads.");
    }
  });

  const refreshDashboard = () => startAnalyzeTransition(async () => {
    clearMessages();
    try {
      hydrateDashboard(await fetchAiAdsDashboard());
    } catch (requestError) {
      setRequestError(requestError, "Nao foi possivel recarregar o dashboard.");
    }
  });

  const handleSaveSettings = () => startSettingsTransition(async () => {
    clearMessages();
    try {
      await saveMetaAdsSettings({ adAccountId, accessToken, targetCpa, targetRoas, ticketAverage, profitMargin: profitMargin / 100, stockLevel: stockLevel.trim() ? Number(stockLevel) : null, seasonality });
      hydrateDashboard(await fetchAiAdsDashboard());
      setAccessToken("");
      setInfoMessage("Configuracao Meta Ads salva com sucesso.");
    } catch (requestError) {
      setRequestError(requestError, "Nao foi possivel salvar a configuracao Meta Ads.");
    }
  });

  const handleSync = () => startSyncTransition(async () => {
    clearMessages();
    try {
      hydrateDashboard(await syncMetaAds({ datePreset }));
      setInfoMessage("Sincronizacao com Meta Ads concluida.");
    } catch (requestError) {
      setRequestError(requestError, "Nao foi possivel sincronizar a conta Meta Ads.");
    }
  });

  const loadSample = () => {
    setPayload(JSON.stringify(AI_ADS_SAMPLE_INPUT, null, 2));
    setAnalysis(null);
    setError(null);
    setInfoMessage("Sample carregado no editor.");
  };

  return {
    payload, setPayload, analysis, account, latestSync, error, infoMessage, datePreset, setDatePreset,
    adAccountId, setAdAccountId, accessToken, setAccessToken, targetCpa, setTargetCpa, targetRoas, setTargetRoas,
    ticketAverage, setTicketAverage, profitMargin, setProfitMargin, stockLevel, setStockLevel, seasonality, setSeasonality,
    isAnalyzing, isSavingSettings, isSyncing, analyzePayload, refreshDashboard, handleSaveSettings, handleSync, loadSample
  };
}
