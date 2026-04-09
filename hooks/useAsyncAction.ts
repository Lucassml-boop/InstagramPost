"use client";

import { useState } from "react";

export function useAsyncAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(action: () => Promise<T>) {
    setIsLoading(true);
    setError(null);

    try {
      return await action();
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Unexpected error.";
      setError(message);
      throw actionError;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    setError,
    run
  };
}
