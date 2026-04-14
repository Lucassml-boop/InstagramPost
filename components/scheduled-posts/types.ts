export type ScheduledPostItem = {
  id: string;
  caption: string;
  previewUrl: string;
  imageUrl: string;
  imagePath: string;
  postType: "FEED" | "STORY" | "CAROUSEL";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  publicationState: "PUBLISHED" | "ARCHIVED" | "DELETED" | null;
  scheduledTime: string | null;
  publishedAt: string | null;
  assetState: "available" | "deleted" | "remote";
};

export type InstagramFeedItem = {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
};

export type ScheduledPostsDictionary = {
  preview: string;
  caption: string;
  scheduledTime: string;
  publishedAt: string;
  status: string;
  fileStatus: string;
  draftStatus: string;
  scheduledStatus: string;
  publishedStatus: string;
  failedStatus: string;
  publicationStatePublished: string;
  publicationStateArchived: string;
  publicationStateDeleted: string;
  fileAvailable: string;
  fileDeleted: string;
  fileRemote: string;
  editSchedule: string;
  reschedule: string;
  saving: string;
  draftCount: string;
  scheduledCount: string;
  publishedCount: string;
  previewUnavailable: string;
  updatedSuccess: string;
  updateError: string;
  scheduleRequired: string;
  noPosts: string;
  previewAlt: string;
  select: string;
  selectAll: string;
  deleteSelected: string;
  deleting: string;
  clearSelection: string;
  deleteSuccess: string;
  deleteError: string;
  selectAtLeastOne: string;
  instagramFeedTitle: string;
  instagramFeedDescription: string;
  instagramFeedEmpty: string;
  instagramFeedError: string;
  openOnInstagram: string;
  highlightedPost: string;
};

export type GeneratorDictionary = {
  postType: string;
  postTypeFeed: string;
  postTypeStory: string;
  postTypeCarousel: string;
};
