import path from "node:path";

export const CONTENT_SYSTEM_DIR = path.join(process.cwd(), "content-system");
export const AGENDA_PATH = path.join(CONTENT_SYSTEM_DIR, "agenda.json");
export const CONTENT_HISTORY_PATH = path.join(CONTENT_SYSTEM_DIR, "content_history.json");
export const TOPICS_HISTORY_PATH = path.join(CONTENT_SYSTEM_DIR, "topics_history.json");
export const TOPICS_PATH = path.join(CONTENT_SYSTEM_DIR, "topics.json");
export const BRAND_PROFILE_PATH = path.join(CONTENT_SYSTEM_DIR, "brand_profile.json");

export const DAY_ORDER = [
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
  "Domingo"
] as const;

export const DEFAULT_OLLAMA_TIMEOUT_MS = 480_000;
export const DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS = 45_000;
export const DEFAULT_DISABLED_DAYS = new Set(["Sabado", "Domingo"]);
export const DEFAULT_CONTENT_BRAND_COLORS = [
  "Cor principal: #1d4ed8",
  "Cor de fundo: #101828",
  "Cor de apoio: #38bdf8",
  "Cor de destaque: #f8fafc"
].join("\n");

export type DayLabel = (typeof DAY_ORDER)[number];
