import { enCoreDictionary } from "./i18n.en.core.ts";
import { enAuthDictionary } from "./i18n.en.auth.ts";
import { enWorkspaceDictionary } from "./i18n.en.workspace.ts";
import { enGeneratorDictionary } from "./i18n.en.generator.ts";
import { enScheduledDictionary } from "./i18n.en.scheduled.ts";
import { enAutomationDictionary } from "./i18n.en.automation.ts";
import { enDiagnosticsDictionary } from "./i18n.en.diagnostics.ts";

export const enDictionary = {
  ...enCoreDictionary,
  ...enAuthDictionary,
  ...enWorkspaceDictionary,
  ...enGeneratorDictionary,
  ...enScheduledDictionary,
  ...enAutomationDictionary,
  ...enDiagnosticsDictionary
};

export type Dictionary = typeof enDictionary;
