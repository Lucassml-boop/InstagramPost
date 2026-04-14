import { prisma } from "@/lib/prisma";
import { createDraftPost, schedulePost } from "@/lib/posts";
import {
  getContentBrandProfile,
  getCurrentWeeklyAgenda
} from "@/lib/content-system.storage";
import { attachAgendaPostStatuses } from "@/lib/content-system.agenda-status";
import { generateInstagramCarouselPosts, generateInstagramPost } from "@/lib/openai";
import { renderPostImage } from "@/lib/renderer";
import { getPersistedPreviewUrl, slugify } from "@/lib/storage";
import {
  buildAgendaMessage,
  DEFAULT_BRAND_COLORS,
  inferPostTypeFromFormat,
  inferToneFromAgendaItem
} from "@/lib/weekly-agenda-preview-helpers";

const PRE_GENERATION_WINDOW_MS = 5 * 60 * 1000;
const inFlightAgendaKeys = new Set<string>();

function buildAgendaRuntimeKey(input: { userId: string; date: string; time: string; theme: string }) {
  return `${input.userId}:${input.date}:${input.time}:${input.theme}`;
}

function getAgendaItemDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`);
}

async function findAutomationUser() {
  const user = await prisma.user.findFirst({
    where: {
      instagramAccount: {
        connected: true
      }
    },
    select: {
      id: true,
      email: true,
      emailEncrypted: true,
      emailIv: true,
      emailTag: true,
      preferredOutputLanguage: true,
      preferredCustomInstructions: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    preferredOutputLanguage:
      user.preferredOutputLanguage === "pt-BR"
        ? ("pt-BR" as const)
        : ("en" as const),
    preferredCustomInstructions: user.preferredCustomInstructions
  };
}

async function createScheduledDraftFromAgendaItem(input: {
  userId: string;
  item: Awaited<ReturnType<typeof attachAgendaPostStatuses>>[number];
  brandBrief: string;
  preferredOutputLanguage: "en" | "pt-BR";
  preferredCustomInstructions?: string | null;
  scheduledTime: Date;
}) {
  const postType = inferPostTypeFromFormat(input.item.format);
  const generationInput = {
    topic: input.item.theme,
    message: buildAgendaMessage(input.item, input.brandBrief),
    tone: inferToneFromAgendaItem(input.item),
    postType,
    carouselSlideCount:
      postType === "carousel" ? Math.min(Math.max(input.item.structure.length, 2), 10) : 3,
    carouselSlideContexts: postType === "carousel" ? input.item.structure : [],
    outputLanguage: input.preferredOutputLanguage,
    customInstructions: input.preferredCustomInstructions?.trim() || "",
    brandColors: DEFAULT_BRAND_COLORS,
    keywords: input.item.topicKeywords.join(", ")
  };

  const generatedCarousel =
    postType === "carousel" ? await generateInstagramCarouselPosts(generationInput) : null;
  const generated = generatedCarousel
    ? {
        caption: generatedCarousel.caption,
        hashtags: generatedCarousel.hashtags,
        html: generatedCarousel.slides[0].html,
        css: generatedCarousel.slides[0].css
      }
    : await generateInstagramPost(generationInput);

  const slidesToRender = generatedCarousel?.slides ?? [generated];
  const renderedImages = [];

  for (const [index, slide] of slidesToRender.entries()) {
    const image = await renderPostImage({
      slug: `${slugify(input.item.theme)}-${index + 1}`,
      html: slide.html,
      css: slide.css,
      width: 1080,
      height: postType === "story" ? 1920 : 1080
    });

    renderedImages.push(image);
  }

  const draft = await createDraftPost({
    userId: input.userId,
    topic: input.item.theme,
    message: generationInput.message,
    tone: generationInput.tone,
    postType,
    brandColors: DEFAULT_BRAND_COLORS,
    keywords: generationInput.keywords,
    caption: generated.caption,
    hashtags: generated.hashtags,
    htmlLayout: JSON.stringify({
      html: generated.html,
      css: generated.css
    }),
    mediaItems: renderedImages.map((image) => ({
      imageUrl: image.publicPath,
      imagePath: image.absolutePath,
      previewUrl: getPersistedPreviewUrl(image.publicPath)
    })),
    imageUrl: renderedImages[0]?.publicPath ?? "",
    imagePath: renderedImages[0]?.absolutePath ?? ""
  });

  await schedulePost({
    postId: draft.id,
    userId: input.userId,
    caption: generated.caption,
    scheduledTime: input.scheduledTime,
    postType,
    mediaItems: renderedImages.map((image) => ({
      imageUrl: image.publicPath,
      imagePath: image.absolutePath,
      previewUrl: getPersistedPreviewUrl(image.publicPath)
    })),
    imageUrl: renderedImages[0]?.publicPath ?? "",
    imagePath: renderedImages[0]?.absolutePath ?? ""
  });

  return draft.id;
}

export async function prepareUpcomingAgendaPosts(referenceDate = new Date()) {
  const automationUser = await findAutomationUser();
  if (!automationUser) {
    return { prepared: 0, scanned: 0 };
  }

  const [agenda, brandProfile] = await Promise.all([
    getCurrentWeeklyAgenda(),
    getContentBrandProfile()
  ]);

  if (agenda.length === 0) {
    return { prepared: 0, scanned: 0 };
  }

  const agendaWithStatus = await attachAgendaPostStatuses(automationUser.id, agenda);
  const dueItems = agendaWithStatus.filter((item) => {
    if (item.postGenerationStatus !== "not-generated") {
      return false;
    }

    const scheduledTime = getAgendaItemDateTime(item.date, item.time);
    const timeUntilScheduled = scheduledTime.getTime() - referenceDate.getTime();
    return timeUntilScheduled > 0 && timeUntilScheduled <= PRE_GENERATION_WINDOW_MS;
  });

  let prepared = 0;

  for (const item of dueItems) {
    const runtimeKey = buildAgendaRuntimeKey({
      userId: automationUser.id,
      date: item.date,
      time: item.time,
      theme: item.theme
    });

    if (inFlightAgendaKeys.has(runtimeKey)) {
      continue;
    }

    inFlightAgendaKeys.add(runtimeKey);

    try {
      await createScheduledDraftFromAgendaItem({
        userId: automationUser.id,
        item,
        brandBrief: brandProfile.editableBrief,
        preferredOutputLanguage: automationUser.preferredOutputLanguage,
        preferredCustomInstructions: automationUser.preferredCustomInstructions,
        scheduledTime: getAgendaItemDateTime(item.date, item.time)
      });
      prepared += 1;
    } catch (error) {
      console.error("Weekly agenda pre-generation failed", {
        date: item.date,
        time: item.time,
        theme: item.theme,
        error
      });
    } finally {
      inFlightAgendaKeys.delete(runtimeKey);
    }
  }

  return {
    prepared,
    scanned: dueItems.length
  };
}
