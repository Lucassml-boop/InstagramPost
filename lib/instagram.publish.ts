import { INSTAGRAM_API_VERSION } from "./instagram.constants.ts";
import { getInstagramAccessToken, getStoredInstagramUserId } from "./instagram.access-token.ts";
import { assertImageUrlIsReachable, publishInstagramCreation, waitForInstagramMediaContainer } from "./instagram.media.ts";
import type { InstagramPostType, PublishableMediaItem } from "./instagram.types.ts";

export async function publishInstagramPost(input: {
  userId: string;
  postType: InstagramPostType;
  caption: string;
  mediaItems: PublishableMediaItem[];
}) {
  if (input.mediaItems.length === 0) {
    throw new Error("At least one image is required to publish.");
  }
  const { account, accessToken } = await getInstagramAccessToken(input.userId);
  const instagramUserId = getStoredInstagramUserId(account);

  if (input.postType === "carousel") {
    if (input.mediaItems.length < 2 || input.mediaItems.length > 10) {
      throw new Error("Carousel posts require between 2 and 10 images.");
    }
    const childCreationIds: string[] = [];
    for (const item of input.mediaItems) {
      await assertImageUrlIsReachable(item.imageUrl);
      const childResponse = await fetch(
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
        throw new Error(childJson.error?.message ?? "Unable to create Instagram carousel media item.");
      }
      const creationId = String(childJson.id);
      childCreationIds.push(creationId);
      await waitForInstagramMediaContainer({ creationId, accessToken, instagramUserId });
    }
    const carouselResponse = await fetch(
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
      throw new Error(carouselJson.error?.message ?? "Unable to create Instagram carousel.");
    }
    return publishInstagramCreation({
      accessToken,
      instagramUserId,
      creationId: String(carouselJson.id)
    });
  }

  const primaryMedia = input.mediaItems[0];
  await assertImageUrlIsReachable(primaryMedia.imageUrl);
  const mediaResponse = await fetch(
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
    throw new Error(mediaJson.error?.message ?? "Unable to create Instagram media container.");
  }
  return publishInstagramCreation({
    accessToken,
    instagramUserId,
    creationId: String(mediaJson.id)
  });
}
