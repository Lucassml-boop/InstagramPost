"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/shared";
import { useCaptionGenerator } from "@/hooks/useCaptionGenerator";
import { DEFAULT_CUSTOM_INSTRUCTIONS } from "./constants";
import { CaptionGeneratorDraft } from "./CaptionGeneratorDraft";
import { CaptionGeneratorFields } from "./CaptionGeneratorFields";
import { CaptionGeneratorAutoModal } from "./CaptionGeneratorAutoModal";
import { CaptionGeneratorPreview } from "./CaptionGeneratorPreview";
import { buildCaptionGeneratorDictionary } from "./caption-generator.dictionary";
import type { OutputLanguage } from "./types";
import { useAutoCreatePostInputs } from "./useAutoCreatePostInputs";
import { useCaptionGeneratorNavigation } from "./useCaptionGeneratorNavigation";

export function CaptionGenerator({
  initialOutputLanguage = "en",
  initialCustomInstructions = DEFAULT_CUSTOM_INSTRUCTIONS
}: {
  initialOutputLanguage?: OutputLanguage;
  initialCustomInstructions?: string;
}) {
  const { dictionary } = useI18n();
  const navigation = useCaptionGeneratorNavigation();
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const {
    topic,
    setTopic,
    message,
    setMessage,
    lastAutoGenerateTopicHint,
    setLastAutoGenerateTopicHint,
    postType,
    setPostType,
    carouselSlideCount,
    setCarouselSlideCount,
    carouselSlideContexts,
    setCarouselSlideContexts,
    storyCaptionMode,
    setStoryCaptionMode,
    tone,
    setTone,
    outputLanguage,
    customInstructions,
    brandColors,
    setBrandColors,
    brandColorsHistory,
    keywords,
    setKeywords,
    draft,
    setDraft,
    caption,
    setCaption,
    scheduleTime,
    setScheduleTime,
    error,
    setError,
    isGenerating,
    isPublishing,
    progressValue,
    elapsedMs,
    clientTimeoutMs,
    generationStatus,
    shouldShowSlowMessage,
    shouldShowCaptionEditor,
    effectiveCaption,
    saveBrandColorsToHistory,
    removeBrandColorsFromHistory,
    generatePost,
    generatePostIgnoringSimilar,
    clearFocusHints,
    cancelGeneration,
    clearGeneratedPost,
    publishNow,
    schedulePost
  } = useCaptionGenerator({
    initialOutputLanguage,
    initialCustomInstructions,
    dictionary: buildCaptionGeneratorDictionary(dictionary),
    onPublished: navigation.onPublished,
    onScheduled: navigation.onScheduled
  });
  const {
    autoFieldKey,
    isAutoGeneratingAll,
    generateCreatePostInputs,
    generateAllCreatePostInputs
  } = useAutoCreatePostInputs({
    dictionary,
    topic,
    setTopic,
    message,
    setMessage,
    postType,
    tone,
    brandColors,
    keywords,
    setKeywords,
    carouselSlideCount,
    carouselSlideContexts,
    setCarouselSlideContexts,
    outputLanguage,
    customInstructions,
    setError
  });

  async function handleAutoGenerateAllSubmit(userTopicHint: string) {
    setLastAutoGenerateTopicHint(userTopicHint);
    setIsAutoGenerateModalOpen(false);
    generateAllCreatePostInputs(userTopicHint.trim());
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <CaptionGeneratorFields
            dictionary={dictionary}
            autoFieldKey={autoFieldKey}
            topic={topic}
            setTopic={setTopic}
            message={message}
            setMessage={setMessage}
            postType={postType}
            setPostType={setPostType}
            draft={draft}
            setDraft={setDraft}
            tone={tone}
            setTone={setTone}
            brandColors={brandColors}
            setBrandColors={setBrandColors}
            brandColorsHistory={brandColorsHistory}
            saveBrandColorsToHistory={saveBrandColorsToHistory}
            removeBrandColorsFromHistory={removeBrandColorsFromHistory}
            carouselSlideCount={carouselSlideCount}
            setCarouselSlideCount={setCarouselSlideCount}
            carouselSlideContexts={carouselSlideContexts}
            setCarouselSlideContexts={setCarouselSlideContexts}
            storyCaptionMode={storyCaptionMode}
            setStoryCaptionMode={setStoryCaptionMode}
            keywords={keywords}
            setKeywords={setKeywords}
            onGenerateField={(field) => void generateCreatePostInputs(field)}
          />
          <CaptionGeneratorDraft
            dictionary={dictionary}
            isGenerating={isGenerating}
            progressValue={progressValue}
            elapsedMs={elapsedMs}
            clientTimeoutMs={clientTimeoutMs}
            generationStatus={generationStatus}
            shouldShowSlowMessage={shouldShowSlowMessage}
            postType={postType}
            carouselSlideCount={carouselSlideCount}
            cancelGeneration={cancelGeneration}
            isAutoGeneratingAll={isAutoGeneratingAll}
            openAutoGenerateAllModal={() => setIsAutoGenerateModalOpen(true)}
            generatePost={() => void generatePost()}
            generatePostIgnoringSimilar={generatePostIgnoringSimilar}
            lastAutoGenerateTopicHint={lastAutoGenerateTopicHint}
            clearFocusHints={clearFocusHints}
            topic={topic}
            message={message}
            keywords={keywords}
            draft={draft}
            shouldShowCaptionEditor={shouldShowCaptionEditor}
            caption={caption}
            setCaption={setCaption}
            isPublishing={isPublishing}
            clearGeneratedPost={clearGeneratedPost}
            publishNow={publishNow}
            scheduleTime={scheduleTime}
            setScheduleTime={setScheduleTime}
            schedulePost={schedulePost}
            setDraft={setDraft}
            error={error}
          />
        </Panel>

        <CaptionGeneratorPreview
          draft={draft}
          caption={effectiveCaption}
          postType={postType}
          showCaption={shouldShowCaptionEditor}
        />
      </div>

      <CaptionGeneratorAutoModal
        dictionary={dictionary}
        isOpen={isAutoGenerateModalOpen}
        isSubmitting={isAutoGeneratingAll}
        initialValue={lastAutoGenerateTopicHint}
        onClose={() => setIsAutoGenerateModalOpen(false)}
        onSubmit={(value) => void handleAutoGenerateAllSubmit(value)}
      />
    </>
  );
}
