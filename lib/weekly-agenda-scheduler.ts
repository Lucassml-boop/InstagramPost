import { prisma } from "@/lib/prisma";
import { createDraftPost, schedulePost } from "@/lib/posts";
import type { AuthUser } from "@/lib/auth";
import { throwIfGenerationCancelled } from "@/lib/content-system.generation-progress";
import {
  getContentBrandProfile,
  getCurrentWeeklyAgenda
} from "@/lib/content-system.storage";
import {
  attachAgendaPostStatuses,
  getWeeklyPostsForAgenda
} from "@/lib/content-system.agenda-status";
import { getDaySlotBrandColors, isConfirmedDaySlot } from "@/lib/content-system.schedule";
import type { DayLabel } from "@/lib/content-system.constants";
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
  brandColors: string;
}) {
  throwIfGenerationCancelled(input.userId);
  const startedAt = Date.now();
  const heartbeat = setInterval(() => {
    console.info("[content-system] Agenda post generation still running", {
      userId: input.userId,
      date: input.item.date,
      time: input.item.time,
      theme: input.item.theme,
      elapsedMs: Date.now() - startedAt
    });
  }, 30_000);

  const postType = inferPostTypeFromFormat(input.item.format);
  console.info("[content-system] Agenda post generation started", {
    userId: input.userId,
    date: input.item.date,
    time: input.item.time,
    theme: input.item.theme,
    postType
  });

  try {
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
      brandColors: input.brandColors,
      keywords: input.item.topicKeywords.join(", "),
      userTopicHint: "",
      allowSimilarPost: false
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
    throwIfGenerationCancelled(input.userId);

    const slidesToRender = generatedCarousel?.slides ?? [generated];
    const renderedImages = [];

    console.info("[content-system] Agenda post content generated", {
      userId: input.userId,
      date: input.item.date,
      time: input.item.time,
      theme: input.item.theme,
      slides: slidesToRender.length,
      elapsedMs: Date.now() - startedAt
    });

    for (const [index, slide] of slidesToRender.entries()) {
      throwIfGenerationCancelled(input.userId);
      console.info("[content-system] Rendering agenda slide", {
        userId: input.userId,
        date: input.item.date,
        time: input.item.time,
        theme: input.item.theme,
        slideIndex: index + 1,
        slideCount: slidesToRender.length
      });

      const image = await renderPostImage({
        slug: `${slugify(input.item.theme)}-${index + 1}`,
        html: slide.html,
        css: slide.css,
        width: 1080,
        height: postType === "story" ? 1920 : 1080
      });

      renderedImages.push(image);
    }
    throwIfGenerationCancelled(input.userId);

    const draft = await createDraftPost({
      userId: input.userId,
      topic: input.item.theme,
      message: generationInput.message,
      tone: generationInput.tone,
      postType,
      brandColors: input.brandColors,
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

    console.info("[content-system] Agenda post generation finished", {
      userId: input.userId,
      date: input.item.date,
      time: input.item.time,
      theme: input.item.theme,
      draftId: draft.id,
      elapsedMs: Date.now() - startedAt
    });

    return draft.id;
  } finally {
    clearInterval(heartbeat);
  }
}

function sortAgendaItemsByScheduledTime(
  items: Awaited<ReturnType<typeof attachAgendaPostStatuses>>
) {
  return [...items].sort((left, right) => {
    return getAgendaItemDateTime(left.date, left.time).getTime() - getAgendaItemDateTime(right.date, right.time).getTime();
  });
}

async function materializeAgendaItems(input: {
  user: Pick<AuthUser, "id" | "preferredOutputLanguage" | "preferredCustomInstructions">;
  referenceDate?: Date;
  requirePreGenerationWindow: boolean;
  onProgress?: (input: {
    message?: string;
    prepared?: number;
    scanned?: number;
    activeTheme?: string | null;
    currentPostIndex?: number | null;
    totalPosts?: number | null;
  }) => void;
}) {
  throwIfGenerationCancelled(input.user.id);
  const referenceDate = input.referenceDate ?? new Date();
  const [agenda, brandProfile] = await Promise.all([
    getCurrentWeeklyAgenda(),
    getContentBrandProfile()
  ]);

  if (agenda.length === 0) {
    return {
      prepared: 0,
      scanned: 0,
      agenda: [],
      weekPosts: []
    };
  }

  const agendaWithStatus = await attachAgendaPostStatuses(input.user.id, agenda);
  const dueItems = sortAgendaItemsByScheduledTime(agendaWithStatus).filter((item) => {
    if (item.postGenerationStatus !== "not-generated") {
      return false;
    }

    if (!isConfirmedDaySlot(brandProfile, item.day as DayLabel, item.time)) {
      return false;
    }

    if (!input.requirePreGenerationWindow) {
      return getAgendaItemDateTime(item.date, item.time).getTime() > referenceDate.getTime();
    }

    const scheduledTime = getAgendaItemDateTime(item.date, item.time);
    const timeUntilScheduled = scheduledTime.getTime() - referenceDate.getTime();
    return timeUntilScheduled > 0 && timeUntilScheduled <= PRE_GENERATION_WINDOW_MS;
  });

  console.info("[content-system] Agenda materialization scan completed", {
    userId: input.user.id,
    agendaCount: agenda.length,
    dueItemsCount: dueItems.length,
    requirePreGenerationWindow: input.requirePreGenerationWindow
  });
  input.onProgress?.({
    message:
      dueItems.length > 0
        ? `Preparando ${dueItems.length} post(s) vinculado(s) a agenda.`
        : "Nenhum post adicional precisou ser preparado para a agenda.",
    prepared: 0,
    scanned: dueItems.length,
    activeTheme: null,
    currentPostIndex: null,
    totalPosts: dueItems.length
  });

  let prepared = 0;

  for (const [index, item] of dueItems.entries()) {
    throwIfGenerationCancelled(input.user.id);
    const runtimeKey = buildAgendaRuntimeKey({
      userId: input.user.id,
      date: item.date,
      time: item.time,
      theme: item.theme
    });

    if (inFlightAgendaKeys.has(runtimeKey)) {
      continue;
    }

    inFlightAgendaKeys.add(runtimeKey);

    try {
      input.onProgress?.({
        message: `Preparando post ${index + 1} de ${dueItems.length}: ${item.theme}`,
        prepared,
        scanned: dueItems.length,
        activeTheme: item.theme,
        currentPostIndex: index + 1,
        totalPosts: dueItems.length
      });
      console.info("[content-system] Preparing agenda item", {
        userId: input.user.id,
        index: index + 1,
        totalDueItems: dueItems.length,
        date: item.date,
        time: item.time,
        theme: item.theme
      });
      await createScheduledDraftFromAgendaItem({
        userId: input.user.id,
        item,
        brandBrief: brandProfile.editableBrief,
        preferredOutputLanguage: input.user.preferredOutputLanguage === "pt-BR" ? "pt-BR" : "en",
        preferredCustomInstructions: input.user.preferredCustomInstructions,
        scheduledTime: getAgendaItemDateTime(item.date, item.time),
        brandColors:
          getDaySlotBrandColors(brandProfile, item.day as DayLabel, item.time) ||
          DEFAULT_BRAND_COLORS
      });
      prepared += 1;
      input.onProgress?.({
        message: `Post ${index + 1} de ${dueItems.length} preparado com sucesso.`,
        prepared,
        scanned: dueItems.length,
        activeTheme: item.theme,
        currentPostIndex: index + 1,
        totalPosts: dueItems.length
      });
      console.info("[content-system] Agenda item prepared", {
        userId: input.user.id,
        prepared,
        totalDueItems: dueItems.length,
        date: item.date,
        time: item.time,
        theme: item.theme
      });
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

  const refreshedAgenda = await attachAgendaPostStatuses(input.user.id, agenda);
  const weekPosts = await getWeeklyPostsForAgenda(input.user.id, agenda);

  return {
    prepared,
    scanned: dueItems.length,
    agenda: refreshedAgenda,
    weekPosts
  };
}

export async function prepareUpcomingAgendaPosts(referenceDate = new Date()) {
  const automationUser = await findAutomationUser();
  if (!automationUser) {
    return { prepared: 0, scanned: 0 };
  }
  const result = await materializeAgendaItems({
    user: automationUser,
    referenceDate,
    requirePreGenerationWindow: true
  });
  return {
    prepared: result.prepared,
    scanned: result.scanned
  };
}

export async function materializeConfirmedAgendaPosts(
  user: Pick<AuthUser, "id" | "preferredOutputLanguage" | "preferredCustomInstructions">,
  referenceDate = new Date(),
  options?: {
    onProgress?: Parameters<typeof materializeAgendaItems>[0]["onProgress"];
  }
) {
  return materializeAgendaItems({
    user,
    referenceDate,
    requirePreGenerationWindow: false,
    onProgress: options?.onProgress
  });
}
