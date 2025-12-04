import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Dog data structure matching the API response
 */
export interface PrefetchedDog {
  id: number;
  name: string | null;
  image_url: string;
  breed_name: string;
  breed_slug: string;
  avg_rating: number | null;
  rating_count: number;
}

/**
 * API response structure for prefetch endpoint
 */
interface PrefetchApiResponse {
  success: boolean;
  data: {
    items: PrefetchedDog[];
  };
}

/**
 * Options for the useDogPrefetch hook
 */
export interface UseDogPrefetchOptions {
  /** How many dogs to fetch at once (default: 10, max: 20) */
  prefetchCount?: number;
  /** Refill queue when it drops below this threshold (default: 3) */
  refillThreshold?: number;
  /** Whether to persist queue to localStorage (default: true) */
  persistToStorage?: boolean;
}

/**
 * Return type for the useDogPrefetch hook
 */
export interface UseDogPrefetchReturn {
  /** The current dog to display (first in queue) */
  currentDog: PrefetchedDog | null;
  /** The full queue of prefetched dogs */
  queue: PrefetchedDog[];
  /** Number of dogs currently in the queue */
  queueLength: number;
  /** Whether the hook is currently fetching more dogs */
  loading: boolean;
  /** Whether there are no more dogs available to rate */
  noDogs: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Remove the current dog from queue (call after rating/skipping) */
  popDog: () => void;
  /** Clear the entire queue and localStorage */
  clearQueue: () => void;
  /** Manually trigger a fetch for more dogs */
  refetch: () => Promise<void>;
}

/** localStorage key for persisting the queue */
const STORAGE_KEY = "rtd_dog_queue";

/**
 * Custom hook for prefetching dogs to enable instant transitions
 *
 * This hook manages a queue of prefetched dogs, automatically refilling
 * when the queue runs low. It also preloads images for instant display.
 *
 * @example
 * ```tsx
 * const { currentDog, popDog, loading, noDogs } = useDogPrefetch({
 *   prefetchCount: 10,
 *   refillThreshold: 3,
 * });
 *
 * const handleRate = async (value: number) => {
 *   await fetch(`/api/dogs/${currentDog.id}/rate`, { ... });
 *   popDog(); // Instantly shows next dog
 * };
 * ```
 */
export function useDogPrefetch(
  options: UseDogPrefetchOptions = {}
): UseDogPrefetchReturn {
  const {
    prefetchCount = 10,
    refillThreshold = 3,
    persistToStorage = true,
  } = options;

  // Initialize queue from localStorage if available
  const [queue, setQueue] = useState<PrefetchedDog[]>(() => {
    if (!persistToStorage || typeof window === "undefined") {
      return [];
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PrefetchedDog[];
        // Validate the parsed data has expected structure
        if (Array.isArray(parsed) && parsed.every((d) => d.id && d.image_url)) {
          return parsed;
        }
      }
    } catch {
      // localStorage unavailable or corrupted
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [noDogs, setNoDogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if initial fetch has been done
  const initialFetchDone = useRef(false);
  // Track if a fetch is in progress to prevent race conditions
  const fetchInProgress = useRef(false);

  /**
   * Persist queue to localStorage whenever it changes
   */
  useEffect(() => {
    if (!persistToStorage || typeof window === "undefined") {
      return;
    }
    try {
      if (queue.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage full or unavailable - continue without persistence
    }
  }, [queue, persistToStorage]);

  /**
   * Preload images for dogs in the queue
   * This primes the browser cache so images display instantly
   */
  useEffect(() => {
    if (queue.length === 0) return;

    // Preload images for all dogs in queue
    queue.forEach((dog) => {
      // Use Image object to prime browser cache
      const img = new Image();
      img.src = dog.image_url;

      // Also add link preload for higher priority
      const existingLink = document.querySelector(
        `link[href="${dog.image_url}"]`
      );
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = dog.image_url;
        document.head.appendChild(link);
      }
    });
  }, [queue]);

  /**
   * Fetch more dogs from the API
   */
  const fetchMore = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgress.current || loading) {
      return;
    }

    fetchInProgress.current = true;
    setLoading(true);
    setError(null);

    try {
      // Get IDs of dogs already in queue to exclude from fetch
      const excludeIds = queue.map((d) => d.id);
      const excludeParam =
        excludeIds.length > 0 ? `&exclude=${excludeIds.join(",")}` : "";

      const res = await fetch(
        `/api/dogs/prefetch?count=${prefetchCount}${excludeParam}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const json = (await res.json()) as PrefetchApiResponse;

      if (json.success && json.data.items.length > 0) {
        setQueue((prev) => {
          // Dedupe by ID to be extra safe
          const existingIds = new Set(prev.map((d) => d.id));
          const newDogs = json.data.items.filter((d) => !existingIds.has(d.id));
          return [...prev, ...newDogs];
        });
        setNoDogs(false);
      } else {
        // No more dogs available
        setNoDogs(queue.length === 0);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch dogs";
      setError(message);
      console.error("Failed to prefetch dogs:", e);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [loading, prefetchCount, queue]);

  /**
   * Initial fetch on mount if queue is empty
   */
  useEffect(() => {
    if (!initialFetchDone.current && queue.length === 0 && !loading) {
      initialFetchDone.current = true;
      void fetchMore();
    }
  }, [fetchMore, queue.length, loading]);

  /**
   * Auto-refill when queue drops below threshold
   */
  useEffect(() => {
    if (
      queue.length < refillThreshold &&
      queue.length > 0 && // Only refill if we have at least 1 dog (not initial)
      !loading &&
      !noDogs &&
      !fetchInProgress.current
    ) {
      void fetchMore();
    }
  }, [queue.length, refillThreshold, loading, noDogs, fetchMore]);

  /**
   * Get the current dog (first in queue)
   */
  const currentDog = queue[0] ?? null;

  /**
   * Remove the current dog from the queue
   * Call this after rating or skipping
   */
  const popDog = useCallback(() => {
    setQueue((prev) => {
      const newQueue = prev.slice(1);
      // If queue is now empty and we haven't marked noDogs yet,
      // we need to fetch more
      if (newQueue.length === 0 && !noDogs) {
        // Trigger a refetch on next render
        initialFetchDone.current = false;
      }
      return newQueue;
    });
  }, [noDogs]);

  /**
   * Clear the entire queue and localStorage
   * Useful for logout or reset scenarios
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    setNoDogs(false);
    setError(null);
    initialFetchDone.current = false;
    if (persistToStorage && typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [persistToStorage]);

  return {
    currentDog,
    queue,
    queueLength: queue.length,
    loading,
    noDogs,
    error,
    popDog,
    clearQueue,
    refetch: fetchMore,
  };
}

export default useDogPrefetch;
