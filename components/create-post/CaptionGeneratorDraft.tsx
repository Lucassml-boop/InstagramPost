"use client";

import type { GeneratorErrorState } from "./types";
import { GenerationProgress } from "./GenerationProgress";
import { MediaManager } from "./MediaManager";
import { PostScheduler } from "./PostScheduler";
import { formatDuration } from "./utils";
import type { DraftResponse, PostType } from "./types";

export function CaptionGeneratorDraft(input: {
  dictionary: any;
  isGenerating: boolean;
  progressValue: number;
  elapsedMs: number;
  clientTimeoutMs: number;
  shouldShowSlowMessage: boolean;
  postType: PostType;
  carouselSlideCount: number;
  cancelGeneration: () => void;
  isAutoGeneratingAll: boolean;
  generateAllCreatePostInputs: () => void;
  generatePost: () => void;
  generatePostIgnoringSimilar: () => void;
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
      <div className="mt-6">
        <div className="flex flex-wrap gap-3">
          {!input.isGenerating ? (
            <>
              <button
                type="button"
                onClick={input.generateAllCreatePostInputs}
                disabled={input.isAutoGeneratingAll}
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
              >
                {input.isAutoGeneratingAll
                  ? dictionary.generator.autoGeneratingField
                  : dictionary.generator.autoGenerateAllFields}
              </button>
              <button
                type="button"
                onClick={input.generatePost}
                disabled={input.isGenerating}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {input.isGenerating ? dictionary.generator.generating : dictionary.generator.generate}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={input.cancelGeneration}
              className="rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100"
            >
              {dictionary.generator.cancelGeneration}
            </button>
          )}
        </div>
      </div>

      {input.isGenerating ? (
        <GenerationProgress
          progressValue={input.progressValue}
          elapsedMs={input.elapsedMs}
          clientTimeoutMs={input.clientTimeoutMs}
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
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                {input.error.similarPost.details.map((detail) => (
                  <div key={`${detail.field}-${detail.label}`} className="rounded-xl bg-white/60 px-3 py-2">
                    <p className="font-semibold text-red-800">{detail.label}</p>
                    <p className="mt-1 text-red-700">
                      Novo: {detail.candidateValue || "-"}
                    </p>
                    <p className="text-red-700">
                      Post salvo: {detail.existingValue || "-"}
                    </p>
                    {detail.overlapKeywords?.length ? (
                      <p className="text-red-700">
                        Palavras em comum: {detail.overlapKeywords.join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <a
                href={input.error.similarPost.href}
                className="inline-flex rounded-full border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
              >
                Abrir post semelhante
              </a>
              <button
                type="button"
                onClick={input.generatePostIgnoringSimilar}
                disabled={input.isGenerating}
                className="inline-flex rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                Seguir mesmo assim
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
