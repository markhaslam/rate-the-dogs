import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RatePage } from "./RatePage";
import { BrowserRouter } from "react-router-dom";

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock dog data
const mockDog = {
  id: 1,
  name: "Test Dog",
  image_url: "https://example.com/dog.jpg",
  breed_name: "Golden Retriever",
  avg_rating: null,
  rating_count: 0,
};

// Helper to create a mock Response object
function createMockResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
  } as Response;
}

// Wrapper component with router
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe("RatePage", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Default mock - returns successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/dogs/prefetch")) {
        return Promise.resolve(
          createMockResponse({
            success: true,
            data: { items: [mockDog] },
          })
        );
      }
      if (url.includes("/api/me/stats")) {
        return Promise.resolve(
          createMockResponse({
            success: true,
            data: { ratings_count: 0, skips_count: 0 },
          })
        );
      }
      return Promise.resolve(createMockResponse({ success: true }));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loading and error states", () => {
    it("shows loading state when fetching dogs", async () => {
      // Make prefetch hang
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/api/dogs/prefetch")) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return new Promise(() => {}); // Never resolves
        }
        if (url.includes("/api/me/stats")) {
          return Promise.resolve(
            createMockResponse({
              success: true,
              data: { ratings_count: 0, skips_count: 0 },
            })
          );
        }
        return Promise.resolve(createMockResponse({ success: true }));
      });

      render(
        <TestWrapper>
          <RatePage />
        </TestWrapper>
      );

      // Should show loading state
      expect(screen.getByText(/Finding the goodest dogs/i)).toBeInTheDocument();
    });
  });

  // Note: Full rating flow tests are covered by E2E tests in e2e/tests/rating.spec.ts
  // which test the complete user journey including:
  // - Rating a dog and seeing reveal animation
  // - Rating count badge appearing
  // - Skipping dogs
  // - ALREADY_RATED error recovery
});
