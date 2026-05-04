import type { useI18n } from "@/components/I18nProvider";

type Dictionary = ReturnType<typeof useI18n>["dictionary"];

export function buildCaptionGeneratorDictionary(dictionary: Dictionary) {
  return {
    common: {
      serverConnectionError: dictionary.common.serverConnectionError,
      save: dictionary.common.save
    },
    generator: {
      generateError: dictionary.generator.generateError,
      publishError: dictionary.generator.publishError,
      scheduleError: dictionary.generator.scheduleError,
      settingsSaveError: dictionary.generator.settingsSaveError,
      settingsSaved: dictionary.generator.settingsSaved,
      scheduleTimeRequired: dictionary.generator.scheduleTimeRequired,
      generationSlow: dictionary.generator.generationSlow,
      cancelGeneration: dictionary.generator.cancelGeneration,
      generationCanceled: dictionary.generator.generationCanceled,
      clearGeneratedPost: dictionary.generator.clearGeneratedPost
    }
  };
}

export function buildAutoGenerateAllModalDictionary(dictionary: Dictionary) {
  return {
    title: dictionary.generator.autoGenerateModalTitle,
    description: dictionary.generator.autoGenerateModalDescription,
    fieldLabel: dictionary.generator.autoGenerateModalFieldLabel,
    fieldPlaceholder: dictionary.generator.autoGenerateModalFieldPlaceholder,
    cancel: dictionary.generator.autoGenerateModalCancel,
    submit: dictionary.generator.autoGenerateModalSubmit,
    skip: dictionary.generator.autoGenerateModalSkip
  };
}
