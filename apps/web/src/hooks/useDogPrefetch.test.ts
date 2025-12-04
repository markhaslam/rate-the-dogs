import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDogPrefetch, type PrefetchedDog } from "./useDogPrefetch";

// Sample dog data for testing
const createMockDog = (id: number): PrefetchedDog => ({
  id,
  name: `Dog ${id}`,
  image_url: `https://images.dog.ceo/breeds/test/dog${id}.jpg`,
  breed_name: "Test Breed",
  breed_slug: "test-breed",
  avg_rating: 4.5,
  rating_count: 10,
});

const mockDogsResponse = (dogs: PrefetchedDog[]) => ({
  success: true,
  data: { items: dogs },
});

const mockEmptyResponse = () => ({
  success: true,
  data: { items: [] },
});

// Create a mock response helper
const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
});

describe("useDogPrefetch", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    // Reset fetch mock
    mockFetch = vi.fn();
    global.fetch = mockFetch as typeof fetch;

    // Reset localStorage mock
    localStorageStore = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(
      (key: string) => localStorageStore[key] ?? null
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        localStorageStore[key] = value;
      }
    );
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
      (key: string) => {
        delete localStorageStore[key];
      }
    );

    // Mock Image constructor
    vi.stubGlobal(
      "Image",
      class MockImage {
        src = "";
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up preload links
    document
      .querySelectorAll('link[rel="preload"]')
      .forEach((el) => el.remove());
  });

  describe("initialization", () => {
    it("starts with empty queue and triggers fetch", async () => {
      const dogs = [createMockDog(1)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(1);
      });

      expect(mockFetch).toHaveBeenCalled();
    });

    it("fetches dogs on mount when queue is empty", async () => {
      const dogs = [createMockDog(1), createMockDog(2), createMockDog(3)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/dogs/prefetch?count=10")
      );
    });

    it("restores queue from localStorage on mount", async () => {
      const storedDogs = [createMockDog(1), createMockDog(2)];
      localStorageStore["rtd_dog_queue"] = JSON.stringify(storedDogs);

      // Mock for potential refill (threshold = 3, queue = 2)
      mockFetch.mockResolvedValue(
        createMockResponse(mockDogsResponse([createMockDog(3)]))
      );

      const { result } = renderHook(() => useDogPrefetch());

      // Should have dogs from localStorage immediately
      expect(result.current.queueLength).toBe(2);
      expect(result.current.currentDog?.id).toBe(1);
    });

    it("handles corrupted localStorage gracefully", async () => {
      localStorageStore["rtd_dog_queue"] = "invalid json{{{";

      mockFetch.mockResolvedValue(
        createMockResponse(mockDogsResponse([createMockDog(1)]))
      );

      const { result } = renderHook(() => useDogPrefetch());

      // Should start with empty queue (corrupted data ignored)
      // Then fetch will populate
      await waitFor(() => {
        expect(result.current.queueLength).toBe(1);
      });
    });

    it("respects custom prefetchCount option", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(mockDogsResponse([createMockDog(1)]))
      );

      renderHook(() => useDogPrefetch({ prefetchCount: 5 }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("count=5")
        );
      });
    });
  });

  describe("currentDog", () => {
    it("returns first dog in queue as currentDog", async () => {
      const dogs = [createMockDog(1), createMockDog(2)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.currentDog?.id).toBe(1);
      });
    });

    it("returns null when queue is empty and noDogs", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockEmptyResponse()));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.noDogs).toBe(true);
      });

      expect(result.current.currentDog).toBeNull();
    });
  });

  describe("popDog", () => {
    it("removes current dog from queue", async () => {
      const dogs = [createMockDog(1), createMockDog(2), createMockDog(3)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      act(() => {
        result.current.popDog();
      });

      expect(result.current.queueLength).toBe(2);
      expect(result.current.currentDog?.id).toBe(2);
    });

    it("updates localStorage after popping", async () => {
      const dogs = [createMockDog(1), createMockDog(2), createMockDog(3)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(3);
      });

      act(() => {
        result.current.popDog();
      });

      // Check localStorage was updated
      const stored = JSON.parse(localStorageStore["rtd_dog_queue"]);
      expect(stored.length).toBe(2);
      expect(stored[0].id).toBe(2);
    });
  });

  describe("auto-refill", () => {
    it("fetches more when queue drops below threshold", async () => {
      // Start with 4 dogs (above default threshold of 3)
      const initialDogs = [
        createMockDog(1),
        createMockDog(2),
        createMockDog(3),
        createMockDog(4),
      ];

      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        if (fetchCount === 1) {
          return Promise.resolve(
            createMockResponse(mockDogsResponse(initialDogs))
          );
        }
        // Second fetch - refill
        return Promise.resolve(
          createMockResponse(
            mockDogsResponse([createMockDog(5), createMockDog(6)])
          )
        );
      });

      const { result } = renderHook(() =>
        useDogPrefetch({ refillThreshold: 3 })
      );

      await waitFor(() => {
        expect(result.current.queueLength).toBe(4);
      });

      // Pop twice to get to 2 (below threshold of 3)
      act(() => {
        result.current.popDog();
      });
      act(() => {
        result.current.popDog();
      });

      // Should trigger refill
      await waitFor(() => {
        expect(result.current.queueLength).toBe(4); // 2 remaining + 2 new
      });
    });

    it("excludes existing queue IDs when refilling", async () => {
      const initialDogs = [createMockDog(1), createMockDog(2)];

      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        if (fetchCount === 1) {
          return Promise.resolve(
            createMockResponse(mockDogsResponse(initialDogs))
          );
        }
        return Promise.resolve(
          createMockResponse(mockDogsResponse([createMockDog(3)]))
        );
      });

      renderHook(() => useDogPrefetch({ refillThreshold: 3 }));

      // Queue is 2, which is below threshold 3, so it should refill
      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          expect.stringContaining("exclude=1,2")
        );
      });
    });

    it("deduplicates dogs by ID", async () => {
      const initialDogs = [createMockDog(1), createMockDog(2)];

      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        if (fetchCount === 1) {
          return Promise.resolve(
            createMockResponse(mockDogsResponse(initialDogs))
          );
        }
        // Refill includes duplicate ID 1
        return Promise.resolve(
          createMockResponse(
            mockDogsResponse([createMockDog(1), createMockDog(3)])
          )
        );
      });

      const { result } = renderHook(() =>
        useDogPrefetch({ refillThreshold: 3 })
      );

      await waitFor(() => {
        // Should have 2 initial + 1 new (not 4, because ID 1 is deduplicated)
        expect(result.current.queueLength).toBe(3);
      });
    });
  });

  describe("noDogs state", () => {
    it("sets noDogs when API returns empty and queue is empty", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockEmptyResponse()));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.noDogs).toBe(true);
      });
    });

    it("sets noDogs after queue is exhausted", async () => {
      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        if (fetchCount === 1) {
          return Promise.resolve(
            createMockResponse(mockDogsResponse([createMockDog(1)]))
          );
        }
        // Subsequent fetches return empty
        return Promise.resolve(createMockResponse(mockEmptyResponse()));
      });

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(1);
      });

      // Pop the only dog
      act(() => {
        result.current.popDog();
      });

      // Should eventually set noDogs
      await waitFor(() => {
        expect(result.current.noDogs).toBe(true);
      });
    });

    it("does not refetch continuously when noDogs is true", async () => {
      mockFetch.mockResolvedValue(createMockResponse(mockEmptyResponse()));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.noDogs).toBe(true);
      });

      const callCount = mockFetch.mock.calls.length;

      // Wait a bit and verify no new calls
      await new Promise((r) => setTimeout(r, 100));

      expect(mockFetch.mock.calls.length).toBe(callCount);
    });
  });

  describe("error handling", () => {
    it("sets error state on fetch failure", async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, false, 500));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch: 500");
      });
    });

    it("sets error state on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });
    });

    it("error is cleared when clearQueue is called", async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, false, 500));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // clearQueue should clear error
      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("clearQueue", () => {
    it("clears queue and localStorage", async () => {
      const dogs = [createMockDog(1), createMockDog(2)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(2);
      });

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toEqual([]);
      expect(result.current.noDogs).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorageStore["rtd_dog_queue"]).toBeUndefined();
    });

    it("allows refetch after clearing", async () => {
      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        return Promise.resolve(
          createMockResponse(mockDogsResponse([createMockDog(fetchCount)]))
        );
      });

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBeGreaterThan(0);
      });

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toEqual([]);

      // Refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.queueLength).toBeGreaterThan(0);
    });
  });

  describe("image preloading", () => {
    it("creates preload links for images in queue", async () => {
      const dogs = [createMockDog(1), createMockDog(2)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBe(2);
      });

      // Check that preload links were created (note: as="image" is set)
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      expect(preloadLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("localStorage persistence option", () => {
    it("does not persist when persistToStorage is false", async () => {
      const dogs = [createMockDog(1)];
      mockFetch.mockResolvedValue(createMockResponse(mockDogsResponse(dogs)));

      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

      renderHook(() => useDogPrefetch({ persistToStorage: false }));

      await waitFor(() => {
        // Should not have called setItem for our key
        const calls = setItemSpy.mock.calls.filter(
          (call) => call[0] === "rtd_dog_queue"
        );
        expect(calls.length).toBe(0);
      });
    });
  });

  describe("manual refetch", () => {
    it("allows manual refetch via refetch function", async () => {
      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        return Promise.resolve(
          createMockResponse(mockDogsResponse([createMockDog(fetchCount)]))
        );
      });

      const { result } = renderHook(() => useDogPrefetch());

      await waitFor(() => {
        expect(result.current.queueLength).toBeGreaterThan(0);
      });

      const initialLength = result.current.queueLength;

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.queueLength).toBeGreaterThan(initialLength);
    });
  });

  describe("loading state", () => {
    it("sets loading to false after fetch completes", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse(mockDogsResponse([createMockDog(1)]))
      );

      const { result } = renderHook(() => useDogPrefetch());

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.queueLength).toBe(1);
      });

      // Loading should be false after fetch
      expect(result.current.loading).toBe(false);
    });
  });
});
