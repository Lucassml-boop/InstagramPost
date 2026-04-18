import { AiAdsWorkspace } from "@/components/ai-ads";
import { SectionTitle } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";
import { getAiAdsDashboardData } from "@/lib/meta-ads";

export default async function AiAdsPage() {
  const user = await getCurrentUser();
  const initialData = user ? await getAiAdsDashboardData(user.id) : null;

  return (
    <div>
      <SectionTitle
        eyebrow="AI Ads"
        title="Sistema de trafego pago com IA"
        description="Este modulo transforma a base de automacao existente em um cockpit de decisao para campanhas pagas, com analise orientada a lucro, guardrails e fila de execucao pronta para integrar com APIs de Ads."
      />

      <div className="mt-8">
        <AiAdsWorkspace initialData={initialData} />
      </div>
    </div>
  );
}
