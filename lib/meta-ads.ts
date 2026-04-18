export { getMetaAdsAccountSettings, requireMetaAdsAccount, saveMetaAdsAccountSettings } from "./meta-ads/account-service";
export {
  assertMetaAdsRuntimeReady,
  getAiAdsDashboardData,
  getAiAdsDemoPayload,
  persistAiAdsDecisionLog
} from "./meta-ads/dashboard-service";
export { syncMetaAdsAccount } from "./meta-ads/sync-service";
export { metaAdsAccountSettingsSchema, metaAdsSyncRequestSchema, type AiAdsDashboardData } from "./meta-ads/types";
