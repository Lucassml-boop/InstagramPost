"use client";

import { AutoGenerateAllModal } from "./AutoGenerateAllModal";
import { buildAutoGenerateAllModalDictionary } from "./caption-generator.dictionary";
import type { useI18n } from "@/components/I18nProvider";

type Dictionary = ReturnType<typeof useI18n>["dictionary"];

export function CaptionGeneratorAutoModal({
  dictionary,
  isOpen,
  isSubmitting,
  initialValue,
  onClose,
  onSubmit
}: {
  dictionary: Dictionary;
  isOpen: boolean;
  isSubmitting: boolean;
  initialValue: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  return (
    <AutoGenerateAllModal
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      initialValue={initialValue}
      dictionary={buildAutoGenerateAllModalDictionary(dictionary)}
      onClose={onClose}
      onSubmit={(value) => onSubmit(value)}
    />
  );
}
