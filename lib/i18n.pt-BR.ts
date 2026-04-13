import { ptBRCoreDictionary } from "./i18n.pt-BR.core.ts";
import { ptBRAuthDictionary } from "./i18n.pt-BR.auth.ts";
import { ptBRWorkspaceDictionary } from "./i18n.pt-BR.workspace.ts";
import { ptBRGeneratorDictionary } from "./i18n.pt-BR.generator.ts";
import { ptBRScheduledDictionary } from "./i18n.pt-BR.scheduled.ts";
import { ptBRAutomationDictionary } from "./i18n.pt-BR.automation.ts";
import { ptBRDiagnosticsDictionary } from "./i18n.pt-BR.diagnostics.ts";
import type { Dictionary } from "./i18n.en.ts";

export const ptBRDictionary: Dictionary = {
  ...ptBRCoreDictionary,
  ...ptBRAuthDictionary,
  ...ptBRWorkspaceDictionary,
  ...ptBRGeneratorDictionary,
  ...ptBRScheduledDictionary,
  ...ptBRAutomationDictionary,
  ...ptBRDiagnosticsDictionary
};
