"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { ImageUploader } from "@/components/ImageUploader";
import { PostLayoutPreview } from "@/components/PostLayoutPreview";
import { PostScheduler } from "@/components/PostScheduler";
import { Panel } from "@/components/ui";

type DraftResponse = {
  postId: string;
  imageUrl: string;
  imagePath: string;
  caption: string;
  hashtags: string[];
  htmlLayout: string;
};

export function CaptionGenerator() {
  const router = useRouter();
  const { dictionary } = useI18n();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "promotional">("professional");
  const [brandColors, setBrandColors] = useState("#101828, #d62976, #feda75");
  const [keywords, setKeywords] = useState("");
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isPublishing, startPublishing] = useTransition();

  async function generatePost() {
    const startedAt = Date.now();

    setError(null);
    console.info("[post-generator] Starting generation request", {
      topic,
      tone,
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
          tone,
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
      setCaption(`${json.caption}\n\n${json.hashtags.join(" ")}`.trim());
    } catch (error) {
      console.error("[post-generator] Request crashed", {
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      });
      setError(error instanceof Error ? error.message : dictionary.generator.generateError);
    }
  }

  async function publishNow() {
    if (!draft) {
      return;
    }

    const response = await fetch("/api/posts/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: draft.postId,
        caption,
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
  }

  async function schedulePost() {
    if (!draft || !scheduleTime) {
      setError(dictionary.generator.scheduleTimeRequired);
      return;
    }

    const response = await fetch("/api/posts/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: draft.postId,
        caption,
        scheduledTime: new Date(scheduleTime).toISOString(),
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
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel className="p-6">
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

        <div className="mt-6">
          <button
            type="button"
            onClick={() => startGenerating(generatePost)}
            disabled={isGenerating}
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isGenerating ? dictionary.generator.generating : dictionary.generator.generate}
          </button>
        </div>

        {draft ? (
          <div className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {dictionary.generator.editCaption}
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="mt-2 min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
              />
            </label>

            <ImageUploader
              onUploaded={({ imageUrl, imagePath }) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        imageUrl,
                        imagePath
                      }
                    : current
                )
              }
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startPublishing(publishNow)}
                disabled={isPublishing}
                className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {isPublishing ? dictionary.generator.publishing : dictionary.generator.publishNow}
              </button>
            </div>

            <PostScheduler value={scheduleTime} onChange={setScheduleTime} />
            <button
              type="button"
              onClick={() => startPublishing(schedulePost)}
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

      <PostLayoutPreview imageUrl={draft?.imageUrl ?? null} caption={caption} />
    </div>
  );
}
