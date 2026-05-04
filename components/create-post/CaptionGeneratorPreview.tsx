"use client";

import { PostLayoutPreview } from "./PostLayoutPreview";
import type { DraftResponse, PostType } from "./types";

export function CaptionGeneratorPreview({
  draft,
  caption,
  postType,
  showCaption
}: {
  draft: DraftResponse | null;
  caption: string;
  postType: PostType;
  showCaption: boolean;
}) {
  return (
    <PostLayoutPreview
      imageUrl={draft?.imageUrl ?? null}
      mediaItems={draft?.mediaItems ?? []}
      caption={caption}
      postType={postType}
      mediaCount={draft?.mediaItems.length ?? 0}
      showCaption={showCaption}
    />
  );
}
