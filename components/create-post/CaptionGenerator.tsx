"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/shared";
import { useCaptionGenerator } from "@/hooks/useCaptionGenerator";
import { AutoGenerateAllModal } from "./AutoGenerateAllModal";
import { DEFAULT_CUSTOM_INSTRUCTIONS } from "./constants";
import { PostLayoutPreview } from "./PostLayoutPreview";
import { CaptionGeneratorDraft } from "./CaptionGeneratorDraft";
import { CaptionGeneratorFields } from "./CaptionGeneratorFields";
import type { OutputLanguage } from "./types";
import { useAutoCreatePostInputs } from "./useAutoCreatePostInputs";

export function CaptionGenerator({
  initialOutputLanguage = "en",
  initialCustomInstructions = DEFAULT_CUSTOM_INSTRUCTIONS
}: {
  initialOutputLanguage?: OutputLanguage;
  initialCustomInstructions?: string;
}) {
  const router = useRouter();
  const { dictionary } = useI18n();
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [isGeneratePostModalOpen, setIsGeneratePostModalOpen] = useState(false);
  const {
    topic,
    setTopic,
    message,
    setMessage,
    lastAutoGenerateTopicHint,
    setLastAutoGenerateTopicHint,
    lastGeneratePostTopicHint,
    setLastGeneratePostTopicHint,
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
    dictionary: {
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
    },
    onPublished: () => {
      router.push("/dashboard?published=1");
      router.refresh();
    },
    onScheduled: () => {
      router.push("/scheduled-posts?saved=1");
      router.refresh();
    }
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

  async function handleGeneratePostSubmit(userTopicHint: string) {
    setLastGeneratePostTopicHint(userTopicHint);
    setIsGeneratePostModalOpen(false);
    await generatePost(userTopicHint.trim());
  }

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <div className="grid gap-4">
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
              onGenerateField={(field) => {
                void generateCreatePostInputs(field);
              }}
            />
          </div>
          <CaptionGeneratorDraft
            dictionary={dictionary}
            isGenerating={isGenerating}
            progressValue={progressValue}
            elapsedMs={elapsedMs}
            clientTimeoutMs={clientTimeoutMs}
            shouldShowSlowMessage={shouldShowSlowMessage}
            postType={postType}
            carouselSlideCount={carouselSlideCount}
            cancelGeneration={cancelGeneration}
            isAutoGeneratingAll={isAutoGeneratingAll}
            openAutoGenerateAllModal={() => setIsAutoGenerateModalOpen(true)}
            openGeneratePostModal={() => setIsGeneratePostModalOpen(true)}
            generatePostIgnoringSimilar={generatePostIgnoringSimilar}
            lastAutoGenerateTopicHint={lastAutoGenerateTopicHint}
            lastGeneratePostTopicHint={lastGeneratePostTopicHint}
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

        <PostLayoutPreview
          imageUrl={draft?.imageUrl ?? null}
          mediaItems={draft?.mediaItems ?? []}
          caption={effectiveCaption}
          postType={postType}
          mediaCount={draft?.mediaItems.length ?? 0}
          showCaption={shouldShowCaptionEditor}
        />
      </div>

      <AutoGenerateAllModal
        isOpen={isAutoGenerateModalOpen}
        isSubmitting={isAutoGeneratingAll}
        initialValue={lastAutoGenerateTopicHint}
        dictionary={{
          title: dictionary.generator.autoGenerateModalTitle,
          description: dictionary.generator.autoGenerateModalDescription,
          fieldLabel: dictionary.generator.autoGenerateModalFieldLabel,
          fieldPlaceholder: dictionary.generator.autoGenerateModalFieldPlaceholder,
          cancel: dictionary.generator.autoGenerateModalCancel,
          submit: dictionary.generator.autoGenerateModalSubmit,
          skip: dictionary.generator.autoGenerateModalSkip
        }}
        onClose={() => setIsAutoGenerateModalOpen(false)}
        onSubmit={(value, _submitMode) => {
          void handleAutoGenerateAllSubmit(value);
        }}
      />

      <AutoGenerateAllModal
        isOpen={isGeneratePostModalOpen}
        isSubmitting={isGenerating}
        initialValue={lastGeneratePostTopicHint}
        dictionary={{
          title: dictionary.generator.generatePostModalTitle,
          description: dictionary.generator.generatePostModalDescription,
          fieldLabel: dictionary.generator.generatePostModalFieldLabel,
          fieldPlaceholder: dictionary.generator.generatePostModalFieldPlaceholder,
          cancel: dictionary.generator.generatePostModalCancel,
          submit: dictionary.generator.generatePostModalSubmit,
          skip: dictionary.generator.generatePostModalSkip
        }}
        onClose={() => setIsGeneratePostModalOpen(false)}
        onSubmit={(value, _submitMode) => {
          void handleGeneratePostSubmit(value);
        }}
      />
    </>
  );
}
