"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { Panel } from "@/components/shared";
import { useCaptionGenerator } from "@/hooks/useCaptionGenerator";
import { CLIENT_TIMEOUT_MS, DEFAULT_CUSTOM_INSTRUCTIONS } from "./constants";
import { GenerationProgress } from "./GenerationProgress";
import { MediaManager } from "./MediaManager";
import { PostLayoutPreview } from "./PostLayoutPreview";
import { PostScheduler } from "./PostScheduler";
import type { OutputLanguage, PostType } from "./types";
import { createSlideContexts } from "./utils";
import { generateCreatePostInputs as generateCreatePostInputsService } from "@/services/frontend/posts";

export function CaptionGenerator({
  initialOutputLanguage = "en",
  initialCustomInstructions = DEFAULT_CUSTOM_INSTRUCTIONS
}: {
  initialOutputLanguage?: OutputLanguage;
  initialCustomInstructions?: string;
}) {
  const router = useRouter();
  const { dictionary } = useI18n();
  const [autoFieldKey, setAutoFieldKey] = useState<string | null>(null);
  const [isAutoGeneratingAll, startAutoGeneratingAll] = useTransition();
  const {
    topic,
    setTopic,
    message,
    setMessage,
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
    shouldShowSlowMessage,
    shouldShowCaptionEditor,
    effectiveCaption,
    saveBrandColorsToHistory,
    generatePost,
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
        generationSlow: dictionary.generator.generationSlow
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

  function renderAutoButton(key: string, onClick: () => Promise<void>) {
    const isLoading = autoFieldKey === key;

    return (
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          void onClick();
        }}
        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? dictionary.generator.autoGeneratingField : dictionary.generator.autoGenerateField}
      </button>
    );
  }

  async function generateCreatePostInputs(
    field?: "topic" | "message" | "keywords" | "carouselSlideContexts"
  ) {
    const requestKey = field ?? "all";
    setAutoFieldKey(requestKey);
    setError(null);

    try {
      const json = await generateCreatePostInputsService({
        current: {
          topic,
          message,
          postType,
          tone,
          brandColors,
          keywords,
          carouselSlideCount,
          carouselSlideContexts: carouselSlideContexts.map((item) => item.value),
          outputLanguage,
          customInstructions
        }
      });

      if (!field || field === "topic") {
        setTopic(json.topic ?? topic);
      }
      if (!field || field === "message") {
        setMessage(json.message ?? message);
      }
      if (!field || field === "keywords") {
        setKeywords(json.keywords ?? keywords);
      }
      if ((!field || field === "carouselSlideContexts") && postType === "carousel") {
        const nextContexts = json.carouselSlideContexts ?? carouselSlideContexts.map((item) => item.value);
        setCarouselSlideContexts(createSlideContexts(carouselSlideCount).map((item, index) => ({
          ...item,
          value: nextContexts[index] ?? ""
        })));
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : dictionary.generator.generateError
      );
    } finally {
      setAutoFieldKey((current) => (current === requestKey ? null : current));
    }
  }

  function generateAllCreatePostInputs() {
    startAutoGeneratingAll(async () => {
      await generateCreatePostInputs();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel className="p-6">
        <div className="grid gap-4">
            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.generator.topic}</span>
                {renderAutoButton("topic", () => generateCreatePostInputs("topic"))}
              </div>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder={dictionary.generator.topicPlaceholder}
              />
              <span className="mt-2 block text-xs text-slate-500">
                {dictionary.generator.autoGenerateHint}
              </span>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.generator.message}</span>
                {renderAutoButton("message", () => generateCreatePostInputs("message"))}
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder={dictionary.generator.messagePlaceholder}
              />
              <span className="mt-2 block text-xs text-slate-500">
                {dictionary.generator.autoGenerateHint}
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                {dictionary.generator.postType}
                <select
                  value={postType}
                  onChange={(event) => {
                    const nextPostType = event.target.value as PostType;
                    setPostType(nextPostType);

                    if (nextPostType !== "carousel" && draft) {
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              mediaItems: current.mediaItems.slice(0, 1),
                              imageUrl: current.mediaItems[0]?.imageUrl ?? current.imageUrl,
                              imagePath: current.mediaItems[0]?.imagePath ?? current.imagePath
                            }
                          : current
                      );
                    }
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                >
                  <option value="feed">{dictionary.generator.postTypeFeed}</option>
                  <option value="story">{dictionary.generator.postTypeStory}</option>
                  <option value="carousel">{dictionary.generator.postTypeCarousel}</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                {dictionary.generator.tone}
                <select
                  value={tone}
                  onChange={(event) =>
                    setTone(event.target.value as "professional" | "casual" | "promotional")
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                >
                  <option value="professional">{dictionary.generator.toneProfessional}</option>
                  <option value="casual">{dictionary.generator.toneCasual}</option>
                  <option value="promotional">{dictionary.generator.tonePromotional}</option>
                </select>
              </label>

            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.generator.brandColors}</span>
                <button
                  type="button"
                  onClick={() => saveBrandColorsToHistory()}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
                >
                  {dictionary.common.save}
                </button>
              </div>
              <input
                value={brandColors}
                onChange={(event) => setBrandColors(event.target.value)}
                onBlur={() => saveBrandColorsToHistory()}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder="#0f172a, #ea580c, #f8fafc"
              />
              <span className="mt-2 block text-xs text-slate-500">
                {dictionary.generator.brandColorsHint}
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {brandColorsHistory.map((palette) => {
                  const isActive = palette === brandColors;

                  return (
                    <button
                      key={palette}
                      type="button"
                      onClick={() => setBrandColors(palette)}
                      className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${
                        isActive
                          ? "border-ink bg-ink text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-ink"
                      }`}
                    >
                      {palette}
                    </button>
                  );
                })}
              </div>
            </label>
            </div>

            {postType === "carousel" ? (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {dictionary.generator.carouselSlides}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {dictionary.generator.carouselSlidesDescription}
                  </p>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <p className="font-semibold text-ink">
                      {dictionary.generator.carouselDefaultStructure}
                    </p>
                    <p className="mt-2">
                      {dictionary.generator.carouselDefaultStructureDescription}
                    </p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  {dictionary.generator.carouselSlidesCount}
                  <select
                    value={carouselSlideCount}
                    onChange={(event) => setCarouselSlideCount(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                  >
                    {Array.from({ length: 9 }, (_, index) => index + 2).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4">
                  {carouselSlideContexts.map((item, index) => (
                    <label key={item.id} className="block text-sm font-medium text-slate-700">
                      {dictionary.generator.carouselSlideContextLabel} {index + 1}
                      <textarea
                        value={item.value}
                        onChange={(event) =>
                          setCarouselSlideContexts((current) =>
                            current.map((context, contextIndex) =>
                              contextIndex === index
                                ? { ...context, value: event.target.value }
                                : context
                            )
                          )
                        }
                        className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                        placeholder={dictionary.generator.carouselSlideContextPlaceholder}
                      />
                    </label>
                  ))}
                </div>

                <div className="flex justify-end">
                  {renderAutoButton("carouselSlideContexts", () =>
                    generateCreatePostInputs("carouselSlideContexts")
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCarouselSlideContexts(createSlideContexts(carouselSlideCount))}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
                >
                  {dictionary.generator.restoreCarouselStructure}
                </button>
              </div>
            ) : null}

            {postType === "story" ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-ink">{dictionary.generator.storyMode}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {dictionary.generator.storyModeDescription}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setStoryCaptionMode("image-only")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      storyCaptionMode === "image-only"
                        ? "border-ink bg-white text-ink shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {dictionary.generator.storyModeImageOnly}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStoryCaptionMode("with-caption")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      storyCaptionMode === "with-caption"
                        ? "border-ink bg-white text-ink shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {dictionary.generator.storyModeWithCaption}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            <label className="block text-sm font-medium text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>{dictionary.generator.keywords}</span>
                {renderAutoButton("keywords", () => generateCreatePostInputs("keywords"))}
              </div>
              <input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder={dictionary.generator.keywordsPlaceholder}
              />
              <span className="mt-2 block text-xs text-slate-500">
                {dictionary.generator.autoGenerateHint}
              </span>
            </label>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateAllCreatePostInputs}
              disabled={isAutoGeneratingAll}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
            >
              {isAutoGeneratingAll
                ? dictionary.generator.autoGeneratingField
                : dictionary.generator.autoGenerateAllFields}
            </button>
            <button
              type="button"
              onClick={generatePost}
              disabled={isGenerating}
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {isGenerating ? dictionary.generator.generating : dictionary.generator.generate}
            </button>
          </div>
        </div>

        {isGenerating ? (
          <GenerationProgress
            progressValue={progressValue}
            elapsedMs={elapsedMs}
            clientTimeoutMs={CLIENT_TIMEOUT_MS}
            title={dictionary.generator.generationProgress}
            estimate={dictionary.generator.generationEstimate}
            elapsedLabel={dictionary.generator.generationElapsed}
            slowMessage={shouldShowSlowMessage ? dictionary.generator.generationSlow : null}
          />
        ) : null}

        {draft ? (
          <div className="mt-8 space-y-4">
            {shouldShowCaptionEditor ? (
              <label className="block text-sm font-medium text-slate-700">
                {dictionary.generator.editCaption}
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  className="mt-2 min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                />
              </label>
            ) : null}

            <MediaManager
              draft={draft}
              postType={postType}
              uploadTitle={
                postType === "carousel"
                  ? dictionary.upload.carouselTitle
                  : dictionary.upload.title
              }
              uploadDescription={
                postType === "carousel"
                  ? dictionary.upload.carouselDescription
                  : dictionary.upload.description
              }
              removeLabel={dictionary.generator.removeMedia}
              carouselCountLabel={dictionary.generator.carouselCount}
              mediaLabel={dictionary.generator.postType}
              carouselItemLabel={dictionary.generator.postTypeCarousel}
              onDraftChange={setDraft}
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={publishNow}
                disabled={isPublishing}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isPublishing ? dictionary.generator.publishing : dictionary.generator.publishNow}
              </button>
            </div>

            <PostScheduler value={scheduleTime} onChange={setScheduleTime} />
            <button
              type="button"
              onClick={schedulePost}
              disabled={isPublishing}
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
            >
              {dictionary.generator.saveSchedule}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
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
  );
}
