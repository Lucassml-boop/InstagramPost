import { INSTAGRAM_API_VERSION } from "./instagram.constants.ts";
import { getInstagramAccessToken, getStoredInstagramUserId } from "./instagram.access-token.ts";
import { assertImageUrlIsReachable, publishInstagramCreation, waitForInstagramMediaContainer } from "./instagram.media.ts";
import type { InstagramPostType, PublishableMediaItem } from "./instagram.types.ts";

function buildGraphFetchError(action: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(
    `Nao foi possivel ${action} no Instagram porque a conexao com a Graph API falhou. Verifique sua internet, o tunel publico e tente novamente. Detalhe tecnico: ${detail}`
  );
}

async function fetchInstagramGraph(action: string, input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw buildGraphFetchError(action, error);
  }
}

function getInstagramErrorSummary(json: unknown) {
  if (!json || typeof json !== "object") {
    return null;
  }

  const error = (json as { error?: unknown }).error;
  if (!error || typeof error !== "object") {
    return null;
  }

  const details = error as Record<string, unknown>;
  return {
    message: typeof details.message === "string" ? details.message : null,
    type: typeof details.type === "string" ? details.type : null,
    code: typeof details.code === "number" || typeof details.code === "string" ? details.code : null,
    errorSubcode:
      typeof details.error_subcode === "number" || typeof details.error_subcode === "string"
        ? details.error_subcode
        : null,
    fbtraceId: typeof details.fbtrace_id === "string" ? details.fbtrace_id : null
  };
}

function logInstagramGraphFailure(input: {
  action: string;
  status: number;
  postType: InstagramPostType;
  mediaUrl?: string;
  mediaItemsCount: number;
  responseJson: unknown;
}) {
  console.error("[instagram-publish] Graph API request failed", {
    action: input.action,
    status: input.status,
    postType: input.postType,
    mediaUrl: input.mediaUrl,
    mediaItemsCount: input.mediaItemsCount,
    instagramError: getInstagramErrorSummary(input.responseJson)
  });
}

export async function publishInstagramPost(input: {
  userId: string;
  postType: InstagramPostType;
  caption: string;
  mediaItems: PublishableMediaItem[];
}) {
  if (input.mediaItems.length === 0) {
    throw new Error("At least one image is required to publish.");
  }

  console.info("[instagram-publish] Publish request started", {
    userId: input.userId,
    postType: input.postType,
    mediaItemsCount: input.mediaItems.length,
    mediaUrls: input.mediaItems.map((item) => item.imageUrl),
    captionLength: input.caption.length
  });

  const { account, accessToken } = await getInstagramAccessToken(input.userId);
  const instagramUserId = getStoredInstagramUserId(account);

  if (input.postType === "carousel") {
    if (input.mediaItems.length < 2 || input.mediaItems.length > 10) {
      throw new Error("Carousel posts require between 2 and 10 images.");
    }
    const childCreationIds: string[] = [];
    for (const item of input.mediaItems) {
      await assertImageUrlIsReachable(item.imageUrl);
      const childResponse = await fetchInstagramGraph(
        "criar um item do carrossel",
        `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            image_url: item.imageUrl,
            is_carousel_item: "true"
          }).toString()
        }
      );
      const childJson = await childResponse.json();
      if (!childResponse.ok || !childJson.id) {
        logInstagramGraphFailure({
          action: "create-carousel-child",
          status: childResponse.status,
          postType: input.postType,
          mediaUrl: item.imageUrl,
          mediaItemsCount: input.mediaItems.length,
          responseJson: childJson
        });
        throw new Error(childJson.error?.message ?? "Unable to create Instagram carousel media item.");
      }
      const creationId = String(childJson.id);
      console.info("[instagram-publish] Carousel child container created", {
        creationId,
        mediaUrl: item.imageUrl
      });
      childCreationIds.push(creationId);
      await waitForInstagramMediaContainer({ creationId, accessToken, instagramUserId });
    }
    const carouselResponse = await fetchInstagramGraph(
      "criar o carrossel",
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          media_type: "CAROUSEL",
          children: childCreationIds.join(","),
          caption: input.caption
        }).toString()
      }
    );
    const carouselJson = await carouselResponse.json();
    if (!carouselResponse.ok || !carouselJson.id) {
      logInstagramGraphFailure({
        action: "create-carousel-container",
        status: carouselResponse.status,
        postType: input.postType,
        mediaItemsCount: input.mediaItems.length,
        responseJson: carouselJson
      });
      throw new Error(carouselJson.error?.message ?? "Unable to create Instagram carousel.");
    }
    console.info("[instagram-publish] Carousel container created", {
      creationId: String(carouselJson.id),
      childrenCount: childCreationIds.length
    });
    return publishInstagramCreation({
      accessToken,
      instagramUserId,
      creationId: String(carouselJson.id)
    });
  }

  const primaryMedia = input.mediaItems[0];
  await assertImageUrlIsReachable(primaryMedia.imageUrl);
  const mediaResponse = await fetchInstagramGraph(
    "criar o container de midia",
    `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${instagramUserId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        image_url: primaryMedia.imageUrl,
        ...(input.postType === "story" ? { media_type: "STORIES" } : {}),
        ...(input.postType === "feed" ? { caption: input.caption } : {})
      }).toString()
    }
  );
  const mediaJson = await mediaResponse.json();
  if (!mediaResponse.ok || !mediaJson.id) {
    logInstagramGraphFailure({
      action: "create-media-container",
      status: mediaResponse.status,
      postType: input.postType,
      mediaUrl: primaryMedia.imageUrl,
      mediaItemsCount: input.mediaItems.length,
      responseJson: mediaJson
    });
    throw new Error(mediaJson.error?.message ?? "Unable to create Instagram media container.");
  }
  console.info("[instagram-publish] Media container created", {
    creationId: String(mediaJson.id),
    postType: input.postType,
    mediaUrl: primaryMedia.imageUrl
  });
  return publishInstagramCreation({
    accessToken,
    instagramUserId,
    creationId: String(mediaJson.id)
  });
}
