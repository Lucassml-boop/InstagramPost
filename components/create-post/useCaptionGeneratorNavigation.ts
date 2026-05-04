"use client";

import { useRouter } from "next/navigation";

export function useCaptionGeneratorNavigation() {
  const router = useRouter();

  return {
    onPublished() {
      router.push("/dashboard?published=1");
      router.refresh();
    },
    onScheduled() {
      router.push("/scheduled-posts?saved=1");
      router.refresh();
    }
  };
}
