export type InstagramPostType = "feed" | "story" | "carousel";

export type PublishableMediaItem = {
  imageUrl: string;
  imagePath: string;
  previewUrl?: string;
};

export type InstagramFeedMediaItem = {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
};
