"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePortalReady } from "./usePortalReady";
import { deletePosts, schedulePost as schedulePostService } from "@/services/frontend/posts";
import { toDatetimeLocalValue } from "@/components/scheduled-posts/utils";
import type {
  ScheduledPostItem,
  ScheduledPostsDictionary
} from "@/components/scheduled-posts/types";

export function useScheduledPosts(input: {
  posts: ScheduledPostItem[];
  dictionary: Pick<
    ScheduledPostsDictionary,
    | "scheduleRequired"
    | "updateError"
    | "updatedSuccess"
    | "selectAtLeastOne"
    | "deleteError"
    | "deleteSuccess"
  >;
}) {
  const router = useRouter();
  const portalReady = usePortalReady();
  const [, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>({});
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setScheduleValues(
      Object.fromEntries(input.posts.map((post) => [post.id, toDatetimeLocalValue(post.scheduledTime)]))
    );
  }, [input.posts]);

  useEffect(() => {
    setSelectedPostIds((current) =>
      current.filter((postId) => input.posts.some((post) => post.id === postId))
    );
  }, [input.posts]);

  const counts = useMemo(
    () => ({
      scheduled: input.posts.filter((post) => post.status === "SCHEDULED").length,
      published: input.posts.filter((post) => post.status === "PUBLISHED").length,
      processed: input.posts.filter((post) => post.status !== "SCHEDULED").length
    }),
    [input.posts]
  );

  const allDeletableSelected =
    input.posts.length > 0 &&
    input.posts.every((post) => selectedPostIds.includes(post.id));

  function toggleSelection(postId: string) {
    setSelectedPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId]
    );
  }

  function toggleSelectAll() {
    setSelectedPostIds((current) =>
      allDeletableSelected
        ? current.filter((id) => !input.posts.some((post) => post.id === id))
        : input.posts.map((post) => post.id)
    );
  }

  function updateSchedule(post: ScheduledPostItem) {
    const value = scheduleValues[post.id];

    if (!value) {
      setFeedback({ type: "error", message: input.dictionary.scheduleRequired });
      return;
    }

    setSavingPostId(post.id);
    setFeedback(null);

    void (async () => {
      try {
        await schedulePostService({
          postId: post.id,
          caption: post.caption,
          scheduledTime: new Date(value).toISOString(),
          postType: post.postType.toLowerCase() as "feed" | "story" | "carousel",
          mediaItems: [],
          imageUrl: post.imageUrl,
          imagePath: post.imagePath
        });

        setFeedback({ type: "success", message: input.dictionary.updatedSuccess });
        startTransition(() => {
          router.refresh();
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : input.dictionary.updateError
        });
      } finally {
        setSavingPostId(null);
      }
    })();
  }

  function deleteSelectedPosts() {
    if (selectedPostIds.length === 0) {
      setFeedback({ type: "error", message: input.dictionary.selectAtLeastOne });
      return;
    }

    setIsDeleting(true);
    setFeedback(null);

    void (async () => {
      try {
        await deletePosts(selectedPostIds);
        setSelectedPostIds([]);
        setFeedback({ type: "success", message: input.dictionary.deleteSuccess });
        startTransition(() => {
          router.refresh();
        });
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : input.dictionary.deleteError
        });
      } finally {
        setIsDeleting(false);
      }
    })();
  }

  return {
    portalReady,
    feedback,
    scheduleValues,
    setScheduleValues,
    savingPostId,
    selectedPostIds,
    isDeleting,
    counts,
    allDeletableSelected,
    clearSelection: () => setSelectedPostIds([]),
    toggleSelection,
    toggleSelectAll,
    updateSchedule,
    deleteSelectedPosts
  };
}
