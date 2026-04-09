import type {
  GeneratorDictionary,
  ScheduledPostItem,
  ScheduledPostsDictionary
} from "./types";

export function normalizePreviewSrc(src: string) {
  if (!src) {
    return "";
  }

  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/")
  ) {
    return src;
  }

  return `/${src}`;
}

export function toDatetimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(locale);
}

export function getSelectionCountLabel(count: number, dictionary: ScheduledPostsDictionary) {
  return `${count} ${dictionary.select.toLowerCase()}`;
}

export function getStatusLabel(
  status: ScheduledPostItem["status"],
  dictionary: ScheduledPostsDictionary
) {
  if (status === "PUBLISHED") {
    return dictionary.publishedStatus;
  }

  if (status === "FAILED") {
    return dictionary.failedStatus;
  }

  return dictionary.scheduledStatus;
}

export function getAssetLabel(
  assetState: ScheduledPostItem["assetState"],
  dictionary: ScheduledPostsDictionary
) {
  if (assetState === "deleted") {
    return dictionary.fileDeleted;
  }

  if (assetState === "remote") {
    return dictionary.fileRemote;
  }

  return dictionary.fileAvailable;
}

export function getPostTypeLabel(
  postType: ScheduledPostItem["postType"],
  dictionary: GeneratorDictionary
) {
  if (postType === "STORY") {
    return dictionary.postTypeStory;
  }

  if (postType === "CAROUSEL") {
    return dictionary.postTypeCarousel;
  }

  return dictionary.postTypeFeed;
}
