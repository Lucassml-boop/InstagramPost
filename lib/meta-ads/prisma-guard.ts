function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isMetaAdsSchemaMissingError(error: unknown) {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : String(error);

  if (code === "P2021") {
    return true;
  }

  return /MetaAds(Account|SyncRun|CampaignSnapshot|DecisionLog)/i.test(message);
}

export function getMetaAdsSchemaMissingMessage() {
  return "As tabelas de AI Ads ainda nao existem no banco. Rode `npm.cmd run db:push` para aplicar o schema antes de usar esse modulo.";
}
