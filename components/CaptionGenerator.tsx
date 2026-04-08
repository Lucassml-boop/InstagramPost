"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { ImageUploader } from "@/components/ImageUploader";
import { PostLayoutPreview } from "@/components/PostLayoutPreview";
import { PostScheduler } from "@/components/PostScheduler";
import { Panel } from "@/components/ui";

type DraftResponse = {
  postId: string;
  postType: PostType;
  mediaItems: MediaItem[];
  imageUrl: string;
  imagePath: string;
  caption: string;
  hashtags: string[];
  htmlLayout: string;
};

type OutputLanguage = "en" | "pt-BR";
type PostType = "feed" | "story" | "carousel";
type MediaItem = {
  imageUrl: string;
  imagePath: string;
};
type StoryCaptionMode = "image-only" | "with-caption";
type CarouselSlideContext = {
  id: string;
  value: string;
};

const DEFAULT_GENERATION_TIMEOUT_MS = 240_000;
const CLIENT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_OLLAMA_TIMEOUT_MS ?? DEFAULT_GENERATION_TIMEOUT_MS);
const PROGRESS_CAP = 96;
const DEFAULT_CUSTOM_INSTRUCTIONS = "You are an expert Instagram content strategist and visual designer.";
const DEFAULT_CAROUSEL_SLIDE_COUNT = 3;

function buildDefaultCarouselContext(index: number, count: number) {
  if (index === 0) {
    return "Capa / Hook / Scroll Stopper. Deve parar o usuario no feed, chamar atencao, criar curiosidade e prometer valor.";
  }

  if (index === 1) {
    return "Contexto / Problema. Mostre que voce entende a dor da pessoa. O slide 2 tambem precisa ser forte porque o Instagram pode reutiliza-lo como abertura.";
  }

  if (index === count - 1) {
    return "CTA / Call to Action. Leve a pessoa a agir: salvar, comentar, seguir ou pedir contato.";
  }

  if (index === count - 2) {
    return "Insight / Conclusao. Reforce a mensagem principal e sintetize o aprendizado do carrossel.";
  }

  return `Desenvolvimento / Conteudo. Entregue valor no slide ${index + 1} com dica, passo, explicacao ou tutorial.`;
}

function createSlideContexts(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `slide-${index + 1}`,
    value: buildDefaultCarouselContext(index, count)
  })) satisfies CarouselSlideContext[];
}

function normalizeSlideContexts(current: CarouselSlideContext[], count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `slide-${index + 1}`,
    value: current[index]?.value || buildDefaultCarouselContext(index, count)
  })) satisfies CarouselSlideContext[];
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function CaptionGenerator({
  initialOutputLanguage = "en",
  initialCustomInstructions = DEFAULT_CUSTOM_INSTRUCTIONS
}: {
  initialOutputLanguage?: OutputLanguage;
  initialCustomInstructions?: string;
}) {
  const router = useRouter();
  const { dictionary } = useI18n();
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [postType, setPostType] = useState<PostType>("feed");
  const [carouselSlideCount, setCarouselSlideCount] = useState(DEFAULT_CAROUSEL_SLIDE_COUNT);
  const [carouselSlideContexts, setCarouselSlideContexts] = useState<CarouselSlideContext[]>(
    createSlideContexts(DEFAULT_CAROUSEL_SLIDE_COUNT)
  );
  const [storyCaptionMode, setStoryCaptionMode] = useState<StoryCaptionMode>("image-only");
  const [tone, setTone] = useState<"professional" | "casual" | "promotional">("professional");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>(initialOutputLanguage);
  const [customInstructions, setCustomInstructions] = useState(
    initialCustomInstructions || DEFAULT_CUSTOM_INSTRUCTIONS
  );
  const [brandColors, setBrandColors] = useState("#101828, #d62976, #feda75");
  const [keywords, setKeywords] = useState("");
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isGenerating || generationStartedAt === null) {
      setElapsedMs(0);
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - generationStartedAt);
    }, 250);

    return () => window.clearInterval(interval);
  }, [generationStartedAt, isGenerating]);

  const progressValue = isGenerating
    ? Math.min((elapsedMs / CLIENT_TIMEOUT_MS) * 100, PROGRESS_CAP)
    : 0;
  const shouldShowSlowMessage = elapsedMs >= CLIENT_TIMEOUT_MS * 0.7;
  const shouldShowCaptionEditor = postType !== "story" || storyCaptionMode === "with-caption";
  const effectiveCaption = shouldShowCaptionEditor ? caption : "";

  useEffect(() => {
    if (postType !== "carousel") {
      return;
    }

    setCarouselSlideContexts((current) => normalizeSlideContexts(current, carouselSlideCount));
  }, [carouselSlideCount, postType]);

  async function generatePost() {
    const startedAt = Date.now();

    setIsGenerating(true);
    setGenerationStartedAt(startedAt);
    setError(null);
    setSettingsMessage(null);
    console.info("[post-generator] Starting generation request", {
      topic,
      postType,
      carouselSlideCount,
      tone,
      outputLanguage,
      hasCustomInstructions: Boolean(customInstructions.trim()),
      hasMessage: Boolean(message.trim()),
      hasBrandColors: Boolean(brandColors.trim()),
      hasKeywords: Boolean(keywords.trim())
    });

    try {
      const response = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          message,
          postType,
          carouselSlideCount,
          carouselSlideContexts: carouselSlideContexts.map((item) => item.value),
          tone,
          outputLanguage,
          customInstructions,
          brandColors,
          keywords
        })
      });

      console.info("[post-generator] Received response", {
        ok: response.ok,
        status: response.status,
        durationMs: Date.now() - startedAt
      });

      const json = (await response.json()) as DraftResponse & { error?: string };

      if (!response.ok) {
        console.error("[post-generator] Generation failed", {
          status: response.status,
          error: json.error ?? dictionary.generator.generateError
        });
        setError(json.error ?? dictionary.generator.generateError);
        return;
      }

      console.info("[post-generator] Generation succeeded", {
        postId: json.postId,
        hashtagsCount: json.hashtags.length,
        durationMs: Date.now() - startedAt
      });
      setDraft(json);
      setPostType(json.postType);
      setCaption(`${json.caption}\n\n${json.hashtags.join(" ")}`.trim());
    } catch (error) {
      console.error("[post-generator] Request crashed", {
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      });
      setError(error instanceof Error ? error.message : dictionary.generator.generateError);
    } finally {
      setIsGenerating(false);
      setGenerationStartedAt(null);
    }
  }

  async function publishNow() {
    if (!draft) {
      return;
    }

    setSettingsMessage(null);
    setIsPublishing(true);

    try {
      const response = await fetch("/api/posts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: draft.postId,
          caption: effectiveCaption,
          postType,
          mediaItems: draft.mediaItems,
          imageUrl: draft.imageUrl,
          imagePath: draft.imagePath
        })
      });

      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? dictionary.generator.publishError);
        return;
      }

      router.push("/dashboard?published=1");
      router.refresh();
    } finally {
      setIsPublishing(false);
    }
  }

  async function schedulePost() {
    if (!draft || !scheduleTime) {
      setError(dictionary.generator.scheduleTimeRequired);
      return;
    }

    setSettingsMessage(null);
    setIsPublishing(true);

    try {
      const response = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: draft.postId,
          caption: effectiveCaption,
          scheduledTime: new Date(scheduleTime).toISOString(),
          postType,
          mediaItems: draft.mediaItems,
          imageUrl: draft.imageUrl,
          imagePath: draft.imagePath
        })
      });

      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? dictionary.generator.scheduleError);
        return;
      }

      router.push("/scheduled-posts?saved=1");
      router.refresh();
    } finally {
      setIsPublishing(false);
    }
  }

  async function saveGenerationSettings() {
    setError(null);
    setSettingsMessage(null);
    setIsSavingSettings(true);

    try {
      const response = await fetch("/api/user/generation-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputLanguage,
          customInstructions
        })
      });

      const json = (await response.json()) as {
        error?: string;
        outputLanguage?: OutputLanguage;
        customInstructions?: string;
      };

      if (!response.ok) {
        setError(json.error ?? dictionary.generator.settingsSaveError);
        return;
      }

      if (json.outputLanguage) {
        setOutputLanguage(json.outputLanguage);
      }

      if (typeof json.customInstructions === "string") {
        setCustomInstructions(json.customInstructions || DEFAULT_CUSTOM_INSTRUCTIONS);
      }

      setSettingsMessage(dictionary.generator.settingsSaved);
    } catch (error) {
      setError(error instanceof Error ? error.message : dictionary.generator.settingsSaveError);
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel className="p-6">
        <div className="mb-6 flex flex-wrap gap-2 rounded-3xl bg-slate-100 p-2">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "content"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            {dictionary.generator.contentTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === "settings"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            {dictionary.generator.settingsTab}
          </button>
        </div>

        {activeTab === "content" ? (
          <div className="grid gap-4">
            <label className="block text-sm font-medium text-slate-700">
              {dictionary.generator.topic}
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder={dictionary.generator.topicPlaceholder}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              {dictionary.generator.message}
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder={dictionary.generator.messagePlaceholder}
              />
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
                {dictionary.generator.brandColors}
                <input
                  value={brandColors}
                  onChange={(event) => setBrandColors(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                  placeholder="#0f172a, #ea580c, #f8fafc"
                />
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
                    <p className="mt-2">{dictionary.generator.carouselDefaultStructureDescription}</p>
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
              {dictionary.generator.keywords}
              <input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder={dictionary.generator.keywordsPlaceholder}
              />
            </label>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-ink">{dictionary.generator.outputLanguage}</p>
              <p className="mt-1 text-sm text-slate-600">
                {dictionary.generator.outputLanguageDescription}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setOutputLanguage("en")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    outputLanguage === "en"
                      ? "border-ink bg-white text-ink shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {dictionary.generator.outputLanguageEnglish}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOutputLanguage("pt-BR")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    outputLanguage === "pt-BR"
                      ? "border-ink bg-white text-ink shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {dictionary.generator.outputLanguagePtBR}
                  </span>
                </button>
              </div>
            </div>

            <label className="block rounded-3xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700">
              {dictionary.generator.customInstructions}
              <p className="mt-1 text-sm font-normal text-slate-600">
                {dictionary.generator.customInstructionsDescription}
              </p>
              <textarea
                value={customInstructions}
                onChange={(event) => setCustomInstructions(event.target.value)}
                className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-slate-400"
                placeholder={dictionary.generator.customInstructionsPlaceholder}
              />
              <button
                type="button"
                onClick={() => setCustomInstructions(DEFAULT_CUSTOM_INSTRUCTIONS)}
                className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink"
              >
                {dictionary.generator.restoreDefaultInstructions}
              </button>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveGenerationSettings}
                disabled={isSavingSettings}
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSavingSettings ? dictionary.generator.generating : dictionary.common.save}
              </button>

              {settingsMessage ? (
                <p className="text-sm text-emerald-700">{settingsMessage}</p>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={generatePost}
            disabled={isGenerating}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isGenerating ? dictionary.generator.generating : dictionary.generator.generate}
          </button>
        </div>

        {isGenerating ? (
          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {dictionary.generator.generationProgress}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {dictionary.generator.generationEstimate}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-slate-700">
                {Math.round(progressValue)}%
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand via-amber-400 to-emerald-500 transition-[width] duration-300 ease-out"
                style={{ width: `${progressValue}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressValue)}
                aria-label={dictionary.generator.generationProgress}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                {dictionary.generator.generationElapsed}: {formatDuration(elapsedMs)}
              </span>
              <span>~ {formatDuration(CLIENT_TIMEOUT_MS)}</span>
            </div>

            {shouldShowSlowMessage ? (
              <p className="mt-3 text-sm text-amber-700">{dictionary.generator.generationSlow}</p>
            ) : null}
          </div>
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

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-ink">
                {postType === "carousel"
                  ? dictionary.upload.carouselTitle
                  : dictionary.upload.title}
              </p>
              <p className="text-sm text-slate-600">
                {postType === "carousel"
                  ? dictionary.upload.carouselDescription
                  : dictionary.upload.description}
              </p>

              {draft.mediaItems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {draft.mediaItems.map((item, index) => (
                    <div
                      key={`${item.imagePath}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {postType === "carousel"
                            ? `${dictionary.generator.postTypeCarousel} ${index + 1}`
                            : dictionary.generator.postType}
                        </p>
                        <button
                          type="button"
                          disabled={draft.mediaItems.length === 1}
                          onClick={() =>
                            setDraft((current) => {
                              if (!current) {
                                return current;
                              }

                              const nextItems = current.mediaItems.filter(
                                (_, itemIndex) => itemIndex !== index
                              );

                              if (nextItems.length === 0) {
                                return current;
                              }

                              return {
                                ...current,
                                mediaItems: nextItems,
                                imageUrl: nextItems[0].imageUrl,
                                imagePath: nextItems[0].imagePath
                              };
                            })
                          }
                          className="text-sm font-semibold text-slate-600 transition hover:text-ink disabled:opacity-40"
                        >
                          {dictionary.generator.removeMedia}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <ImageUploader
                multiple={postType === "carousel"}
                maxFiles={postType === "carousel" ? Math.max(0, 10 - draft.mediaItems.length) : 1}
                showText={false}
                allowAiToggle
                onUploaded={(items) =>
                  setDraft((current) => {
                    if (!current || items.length === 0) {
                      return current;
                    }

                    const nextItems =
                      postType === "carousel"
                        ? [...current.mediaItems, ...items].slice(0, 10)
                        : items.slice(0, 1);

                    return {
                      ...current,
                      mediaItems: nextItems,
                      imageUrl: nextItems[0].imageUrl,
                      imagePath: nextItems[0].imagePath
                    };
                  })
                }
              />

              {postType === "carousel" ? (
                <p className="text-sm text-slate-600">
                  {dictionary.generator.carouselCount}: {draft.mediaItems.length}/10
                </p>
              ) : null}
            </div>

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
