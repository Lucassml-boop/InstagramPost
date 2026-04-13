import {
  DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS,
  DEFAULT_OLLAMA_TIMEOUT_MS
} from "./content-system.constants.ts";
import { requestOllamaJson } from "./content-system.client.ts";
import {
  automaticCreatePostInputsSchema,
  automaticPostIdeaSchema,
  automaticSettingSchema,
  automaticSettingsBundleSchema,
  createWeeklyAgendaSchema
} from "./content-system.schemas.ts";

export async function requestWeeklyAgenda(prompt: string, expectedCount: number) {
  return createWeeklyAgendaSchema(expectedCount).parse(
    (
      (await requestOllamaJson({
        prompt,
        system: "Você gera agendas editoriais semanais estruturadas para Instagram em JSON puro.",
        timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_OLLAMA_TIMEOUT_MS),
        temperature: 0.6
      })) as { week?: unknown }
    ).week
  );
}

export async function requestAutomaticPostIdea(prompt: string) {
  return automaticPostIdeaSchema.parse(
    await requestOllamaJson({
      prompt,
      system:
        "Voce cria direcionamentos editoriais detalhados para posts de Instagram e responde somente com JSON puro.",
      timeoutMs: Number(
        process.env.AUTOMATIC_POST_IDEA_TIMEOUT_MS ?? DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS
      )
    })
  );
}

export async function requestAutomaticSetting(prompt: string) {
  return automaticSettingSchema.parse(
    await requestOllamaJson({
      prompt,
      system:
        "Voce melhora configuracoes editoriais para Instagram e responde somente com JSON puro.",
      timeoutMs: Number(
        process.env.AUTOMATIC_SETTING_TIMEOUT_MS ?? DEFAULT_AUTOMATIC_POST_IDEA_TIMEOUT_MS
      )
    })
  );
}

export async function requestAutomaticSettingsBundle(prompt: string) {
  return automaticSettingsBundleSchema.parse(
    await requestOllamaJson({
      prompt,
      system:
        "Voce recalibra configuracoes editoriais completas para Instagram e responde somente com JSON puro.",
      timeoutMs: Number(process.env.AUTOMATIC_SETTINGS_BUNDLE_TIMEOUT_MS ?? 60_000)
    })
  );
}

export async function requestAutomaticCreatePostInputs(prompt: string) {
  return automaticCreatePostInputsSchema.parse(
    await requestOllamaJson({
      prompt,
      system:
        "Voce prepara inputs coerentes para criacao manual de posts de Instagram e responde somente com JSON puro.",
      timeoutMs: Number(process.env.AUTOMATIC_CREATE_POST_TIMEOUT_MS ?? 45_000)
    })
  );
}
