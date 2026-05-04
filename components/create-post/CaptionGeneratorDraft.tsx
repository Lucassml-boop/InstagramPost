"use client";

import type { GeneratorErrorState } from "./types";
import { CaptionGeneratorControls } from "./CaptionGeneratorControls";
import { GenerationProgress } from "./GenerationProgress";
import { MediaManager } from "./MediaManager";
import { PostScheduler } from "./PostScheduler";
import { SimilarPostErrorPanel } from "./SimilarPostErrorPanel";
import { formatDuration } from "./utils";
import type { DraftResponse, GenerationStatus, PostType } from "./types";

export function CaptionGeneratorDraft(input: {
  dictionary: any;
  isGenerating: boolean;
  progressValue: number;
  elapsedMs: number;
  clientTimeoutMs: number;
  generationStatus: GenerationStatus;
  shouldShowSlowMessage: boolean;
  postType: PostType;
  carouselSlideCount: number;
  cancelGeneration: () => void;
  isAutoGeneratingAll: boolean;
  openAutoGenerateAllModal: () => void;
  generatePost: () => void;
  generatePostIgnoringSimilar: (userTopicHint?: string) => void;
  lastAutoGenerateTopicHint: string;
  clearFocusHints: () => void;
  topic: string;
  message: string;
  keywords: string;
  draft: DraftResponse | null;
  shouldShowCaptionEditor: boolean;
  caption: string;
  setCaption: (value: string) => void;
  isPublishing: boolean;
  clearGeneratedPost: () => void;
  publishNow: () => void;
  scheduleTime: string;
  setScheduleTime: (value: string) => void;
  schedulePost: () => void;
  setDraft: React.Dispatch<React.SetStateAction<DraftResponse | null>>;
  error: GeneratorErrorState | null;
}) {
  const { dictionary } = input;

  return (
    <>
      <CaptionGeneratorControls
        dictionary={dictionary}
        isGenerating={input.isGenerating}
        isAutoGeneratingAll={input.isAutoGeneratingAll}
        openAutoGenerateAllModal={input.openAutoGenerateAllModal}
        generatePost={input.generatePost}
        cancelGeneration={input.cancelGeneration}
        clearFocusHints={input.clearFocusHints}
        lastAutoGenerateTopicHint={input.lastAutoGenerateTopicHint}
        topic={input.topic}
        message={input.message}
        keywords={input.keywords}
      />

      {input.isGenerating ? (
        <GenerationProgress
          progressValue={input.progressValue}
          elapsedMs={input.elapsedMs}
          clientTimeoutMs={input.clientTimeoutMs}
          generationStatus={input.generationStatus}
          title={dictionary.generator.generationProgress}
          estimate={dictionary.generator.generationEstimate(
            formatDuration(input.clientTimeoutMs),
            input.postType === "carousel" ? input.carouselSlideCount : null
          )}
          elapsedLabel={dictionary.generator.generationElapsed}
          slowMessage={input.shouldShowSlowMessage ? dictionary.generator.generationSlow : null}
        />
      ) : null}

      {input.draft ? (
        <div className="mt-8 space-y-4">
          {input.shouldShowCaptionEditor ? (
            <label className="block text-sm font-medium text-slate-700">
              {dictionary.generator.editCaption}
              <textarea
                value={input.caption}
                onChange={(event) => input.setCaption(event.target.value)}
                className="mt-2 min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
              />
            </label>
          ) : null}

          <MediaManager
            draft={input.draft}
            postType={input.postType}
            uploadTitle={
              input.postType === "carousel"
                ? dictionary.upload.carouselTitle
                : dictionary.upload.title
            }
            uploadDescription={
              input.postType === "carousel"
                ? dictionary.upload.carouselDescription
                : dictionary.upload.description
            }
            removeLabel={dictionary.generator.removeMedia}
            carouselCountLabel={dictionary.generator.carouselCount}
            mediaLabel={dictionary.generator.postType}
            carouselItemLabel={dictionary.generator.postTypeCarousel}
            onDraftChange={input.setDraft}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={input.clearGeneratedPost}
              disabled={input.isPublishing}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
            >
              {dictionary.generator.clearGeneratedPost}
            </button>
            <button
              type="button"
              onClick={input.publishNow}
              disabled={input.isPublishing}
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {input.isPublishing ? dictionary.generator.publishing : dictionary.generator.publishNow}
            </button>
          </div>

          <PostScheduler value={input.scheduleTime} onChange={input.setScheduleTime} />
          <button
            type="button"
            onClick={input.schedulePost}
            disabled={input.isPublishing}
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
          >
            {dictionary.generator.saveSchedule}
          </button>
        </div>
      ) : null}

      {input.error ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{typeof input.error === "string" ? input.error : input.error.message}</p>

          {typeof input.error !== "string" ? (
            <SimilarPostErrorPanel
              error={input.error}
              isGenerating={input.isGenerating}
              onContinue={() => input.generatePostIgnoringSimilar()}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
