import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { StatsPage } from "./StatsPage";

// Create a fresh mock fetch for each test
let mockFetch: ReturnType<typeof vi.fn>;

// Type definitions for mock responses
interface MockStatsData {
  ratingsCount: number;
  skipsCount: number;
  avgRatingGiven: number | null;
  firstRatingAt: string | null;
  lastRatingAt: string | null;
  globalAvgRating: number;
  ratingDiffFromGlobal: number | null;
}

interface MockMilestonesData {
  current: number;
  nextMilestone: number | null;
  nextMilestoneName: string | null;
  progressPercent: number;
  completedMilestones: string[];
}

interface MockAchievementData {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface MockResponses {
  stats: { success: boolean; data: MockStatsData };
  topBreeds: {
    success: boolean;
    data: { items: unknown[]; totalBreedsRated: number };
  };
  distribution: {
    success: boolean;
    data: {
      distribution: Record<string, number>;
      modeRating: number;
      totalRatings: number;
    };
  };
  recent: { success: boolean; data: { items: unknown[] } };
  achievements: {
    success: boolean;
    data: {
      milestones: MockMilestonesData;
      achievements: MockAchievementData[];
      unlockedCount: number;
      totalAchievements: number;
    };
  };
}

// Default mock responses
const createDefaultResponses = (): MockResponses => ({
  stats: {
    success: true,
    data: {
      ratingsCount: 42,
      skipsCount: 5,
      avgRatingGiven: 3.8,
      firstRatingAt: "2024-01-15T10:00:00Z",
      lastRatingAt: "2024-12-01T15:30:00Z",
      globalAvgRating: 3.5,
      ratingDiffFromGlobal: 0.3,
    },
  },
  topBreeds: {
    success: true,
    data: {
      items: [
        {
          id: 1,
          name: "Golden Retriever",
          slug: "golden-retriever",
          avgRating: 4.8,
          ratingCount: 12,
          imageUrl: "https://example.com/golden.jpg",
        },
        {
          id: 2,
          name: "Labrador",
          slug: "labrador",
          avgRating: 4.6,
          ratingCount: 8,
          imageUrl: "https://example.com/labrador.jpg",
        },
      ],
      totalBreedsRated: 10,
    },
  },
  distribution: {
    success: true,
    data: {
      distribution: {
        "5.0": 15,
        "4.5": 10,
        "4.0": 8,
        "3.5": 5,
        "3.0": 3,
        "2.5": 1,
      },
      modeRating: 5.0,
      totalRatings: 42,
    },
  },
  recent: {
    success: true,
    data: {
      items: [
        {
          dogId: 1,
          dogName: "Buddy",
          breedName: "Golden Retriever",
          imageUrl: "https://example.com/buddy.jpg",
          rating: 5.0,
          ratedAt: "2024-12-01T15:30:00Z",
        },
        {
          dogId: 2,
          dogName: null,
          breedName: "Labrador",
          imageUrl: "https://example.com/labrador.jpg",
          rating: 4.5,
          ratedAt: "2024-12-01T14:00:00Z",
        },
      ],
    },
  },
  achievements: {
    success: true,
    data: {
      milestones: {
        current: 42,
        nextMilestone: 50,
        nextMilestoneName: "Dedicated Rater",
        progressPercent: 84,
        completedMilestones: ["first_rating", "getting_started"],
      },
      achievements: [
        {
          id: "perfect_score",
          name: "Perfect Score",
          icon: "⭐",
          description: "Found the perfect pup!",
          criteria: "Give a 5.0 rating",
          unlocked: true,
          unlockedAt: "2024-06-15T10:00:00Z",
        },
        {
          id: "breed_explorer",
          name: "Breed Explorer",
          icon: "🗺️",
          description: "A true connoisseur of canine diversity",
          criteria: "Rate dogs from 10+ different breeds",
          unlocked: true,
          unlockedAt: "2024-08-20T14:30:00Z",
        },
        {
          id: "streak_master",
          name: "Streak Master",
          icon: "🔥",
          description: "A week of woofs!",
          criteria: "Rate 7 days in a row",
          unlocked: false,
          unlockedAt: null,
        },
      ],
      unlockedCount: 2,
      totalAchievements: 7,
    },
  },
});

function setupFetchMocks(overrides: Partial<MockResponses> = {}) {
  const responses: MockResponses = {
    ...createDefaultResponses(),
    ...overrides,
  };

  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/api/me/stats")) {
      return Promise.resolve({ json: () => Promise.resolve(responses.stats) });
    }
    if (url.includes("/api/me/top-breeds")) {
      return Promise.resolve({
        json: () => Promise.resolve(responses.topBreeds),
      });
    }
    if (url.includes("/api/me/rating-distribution")) {
      return Promise.resolve({
        json: () => Promise.resolve(responses.distribution),
      });
    }
    if (url.includes("/api/me/recent")) {
      return Promise.resolve({ json: () => Promise.resolve(responses.recent) });
    }
    if (url.includes("/api/me/achievements")) {
      return Promise.resolve({
        json: () => Promise.resolve(responses.achievements),
      });
    }
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
}

function renderWithRouter(component: React.ReactNode) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe("StatsPage", () => {
  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeletons initially", () => {
      // Promise that never resolves to keep component in loading state
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mockFetch.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<StatsPage />);

      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("displays the page title while loading", () => {
      // Promise that never resolves to keep component in loading state
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mockFetch.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<StatsPage />);

      expect(screen.getByText("My Stats")).toBeInTheDocument();
      expect(
        screen.getByText("Your personal dog rating journey")
      ).toBeInTheDocument();
    });
  });

  describe("empty state (new user with 0 ratings)", () => {
    const emptyStatsResponse = {
      success: true,
      data: {
        ratingsCount: 0,
        skipsCount: 0,
        avgRatingGiven: null,
        firstRatingAt: null,
        lastRatingAt: null,
        globalAvgRating: 3.5,
        ratingDiffFromGlobal: null,
      },
    };

    it("shows empty state for users with 0 ratings", async () => {
      setupFetchMocks({ stats: emptyStatsResponse });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("No Stats Yet!")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Start rating dogs to unlock your personal stats/)
      ).toBeInTheDocument();
    });

    it("displays a CTA button to start rating", async () => {
      setupFetchMocks({ stats: emptyStatsResponse });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: /start rating dogs/i })
        ).toBeInTheDocument();
      });
    });

    it("links to the home page from empty state", async () => {
      setupFetchMocks({ stats: emptyStatsResponse });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: /start rating dogs/i });
        expect(link).toHaveAttribute("href", "/");
      });
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Oops! Something went wrong")
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/Couldn't load your stats/)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it("displays retry button on error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /try again/i })
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe("successful data fetch", () => {
    it("displays all stat cards", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Dogs Rated")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("3.8")).toBeInTheDocument();
      expect(screen.getByText("Avg Rating")).toBeInTheDocument();
      expect(screen.getByText("+0.3")).toBeInTheDocument();
      expect(screen.getByText("vs Global")).toBeInTheDocument();
      expect(screen.getByText("Dogs Skipped")).toBeInTheDocument();
    });

    it("displays milestone progress", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Milestone Progress")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("displays rater personality", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Belly Rub Expert")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("displays achievements section", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Achievements")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText("2/7 unlocked")).toBeInTheDocument();
    });

    it("displays rating distribution", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Your Rating Style")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("displays top breeds section", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Your Favorite Breeds")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Top breeds show breed names (may appear in multiple places like Recent Ratings)
      await waitFor(() => {
        const goldens = screen.getAllByText("Golden Retriever");
        expect(goldens.length).toBeGreaterThanOrEqual(1);
      });
      const labradors = screen.getAllByText("Labrador");
      expect(labradors.length).toBeGreaterThanOrEqual(1);
    });

    it("displays recent ratings section", async () => {
      setupFetchMocks();

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Recently Rated")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Recent ratings show breed names, not dog names
      await waitFor(() => {
        // The breed name appears in the card for recent ratings
        const breedElements = screen.getAllByText("Golden Retriever");
        expect(breedElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("edge case: user with exactly 1 rating", () => {
    const singleRatingStats = {
      success: true,
      data: {
        ratingsCount: 1,
        skipsCount: 0,
        avgRatingGiven: 4.5,
        firstRatingAt: "2024-12-01T15:30:00Z",
        lastRatingAt: "2024-12-01T15:30:00Z",
        globalAvgRating: 3.5,
        ratingDiffFromGlobal: 1.0,
      },
    };

    it("shows Puppy Trainee personality for 1 rating", async () => {
      setupFetchMocks({ stats: singleRatingStats });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Puppy Trainee")).toBeInTheDocument();
      });

      expect(screen.getByText(/Still learning the ropes/)).toBeInTheDocument();
    });

    it("shows unlock message for personality", async () => {
      setupFetchMocks({ stats: singleRatingStats });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Rate 9 more dogs to unlock your personality/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("edge case: user at exactly 10 ratings (personality unlock threshold)", () => {
    const tenRatingsStats = {
      success: true,
      data: {
        ratingsCount: 10,
        skipsCount: 2,
        avgRatingGiven: 4.5,
        firstRatingAt: "2024-11-01T10:00:00Z",
        lastRatingAt: "2024-12-01T15:30:00Z",
        globalAvgRating: 3.5,
        ratingDiffFromGlobal: 1.0,
      },
    };

    it("shows actual personality at exactly 10 ratings", async () => {
      setupFetchMocks({ stats: tenRatingsStats });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
      });

      // Should NOT show unlock message
      expect(
        screen.queryByText(/Rate.*more dogs to unlock/)
      ).not.toBeInTheDocument();
    });
  });

  describe("edge case: heavy user with 100+ ratings (Top Dog)", () => {
    const topDogStats = {
      success: true,
      data: {
        ratingsCount: 150,
        skipsCount: 20,
        avgRatingGiven: 3.8,
        firstRatingAt: "2024-01-01T10:00:00Z",
        lastRatingAt: "2024-12-01T15:30:00Z",
        globalAvgRating: 3.5,
        ratingDiffFromGlobal: 0.3,
      },
    };

    it("shows Top Dog badge", async () => {
      setupFetchMocks({ stats: topDogStats });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Top Dog")).toBeInTheDocument();
      });
    });

    it("shows personality AND Top Dog together", async () => {
      setupFetchMocks({ stats: topDogStats });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Belly Rub Expert")).toBeInTheDocument();
        expect(screen.getByText("Top Dog")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: super heavy user with 500+ ratings", () => {
    const superUserStats = {
      success: true,
      data: {
        ratingsCount: 523,
        skipsCount: 45,
        avgRatingGiven: 4.1,
        firstRatingAt: "2023-06-01T10:00:00Z",
        lastRatingAt: "2024-12-01T15:30:00Z",
        globalAvgRating: 3.5,
        ratingDiffFromGlobal: 0.6,
      },
    };

    const superUserMilestones = {
      success: true,
      data: {
        milestones: {
          current: 523,
          nextMilestone: null,
          nextMilestoneName: null,
          progressPercent: 100,
          completedMilestones: [
            "first_rating",
            "getting_started",
            "dedicated_rater",
            "century_club",
            "dog_whisperer",
            "ultimate_rater",
          ],
        },
        achievements: [],
        unlockedCount: 7,
        totalAchievements: 7,
      },
    };

    it("shows all milestones completed", async () => {
      setupFetchMocks({
        stats: superUserStats,
        achievements: superUserMilestones,
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("523")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: personality boundary at 4.2 (Treat Dispenser threshold)", () => {
    it("shows Treat Dispenser at exactly 4.2", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50,
            skipsCount: 0,
            avgRatingGiven: 4.2,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 0.7,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
      });
    });

    it("shows Belly Rub Expert at 4.19", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50,
            skipsCount: 0,
            avgRatingGiven: 4.19,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 0.69,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Belly Rub Expert")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: very critical rater (avg < 2.5)", () => {
    it("shows Picky Pup Parent", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50,
            skipsCount: 10,
            avgRatingGiven: 1.8,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: -1.7,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Picky Pup Parent")).toBeInTheDocument();
      });
    });

    it("shows negative vs global comparison", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50,
            skipsCount: 10,
            avgRatingGiven: 2.0,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: -1.5,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("-1.5")).toBeInTheDocument();
      });

      expect(screen.getByText("Tougher critic")).toBeInTheDocument();
    });
  });

  describe("edge case: null values handling", () => {
    it("handles null avgRatingGiven gracefully", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50,
            skipsCount: 0,
            avgRatingGiven: null,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: null,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        // Should show dash for null values
        const dashElements = screen.getAllByText("—");
        expect(dashElements.length).toBeGreaterThan(0);
      });
    });

    it("handles null ratingDiffFromGlobal", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50, // Must be 10+ to show full stats
            skipsCount: 0,
            avgRatingGiven: 4.0,
            firstRatingAt: "2024-12-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: null,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          // Page loads with stats
          expect(screen.getByText("Dogs Rated")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // vs Global shows dash when null (there might be multiple dashes)
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge case: empty top breeds", () => {
    it("handles empty top breeds list", async () => {
      setupFetchMocks({
        topBreeds: {
          success: true,
          data: {
            items: [],
            totalBreedsRated: 0,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Your Favorite Breeds")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: empty recent ratings", () => {
    it("handles empty recent ratings", async () => {
      setupFetchMocks({
        recent: {
          success: true,
          data: {
            items: [],
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Recently Rated")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: no achievements unlocked", () => {
    it("shows all achievements locked", async () => {
      setupFetchMocks({
        achievements: {
          success: true,
          data: {
            milestones: {
              current: 3,
              nextMilestone: 10,
              nextMilestoneName: "Getting Started",
              progressPercent: 30,
              completedMilestones: ["first_rating"],
            },
            achievements: [
              {
                id: "perfect_score",
                name: "Perfect Score",
                icon: "⭐",
                description: "Found the perfect pup!",
                criteria: "Give a 5.0 rating",
                unlocked: false,
                unlockedAt: null,
              },
            ],
            unlockedCount: 0,
            totalAchievements: 7,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("0/7 unlocked")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: exactly at 100 ratings (Top Dog threshold)", () => {
    it("shows Top Dog at exactly 100 ratings", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 100,
            skipsCount: 5,
            avgRatingGiven: 3.8,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 0.3,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("Top Dog")).toBeInTheDocument();
      });
    });

    it("does not show Top Dog at 99 ratings", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 99,
            skipsCount: 5,
            avgRatingGiven: 3.8,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 0.3,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText("99")).toBeInTheDocument();
      });

      expect(screen.queryByText("Top Dog")).not.toBeInTheDocument();
    });
  });

  describe("edge case: very generous rater (avg = 5.0)", () => {
    it("shows Treat Dispenser for maximum generosity", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 25,
            skipsCount: 0,
            avgRatingGiven: 5.0,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 1.5,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        expect(screen.getByText("+1.5")).toBeInTheDocument();
      });
      expect(screen.getByText("More generous")).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ADDITIONAL EDGE CASES
  // ============================================================================

  describe("edge case: high skip count", () => {
    it("shows high skip count correctly", async () => {
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 30,
            skipsCount: 150,
            avgRatingGiven: 3.5,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 0,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("150")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText("Dogs Skipped")).toBeInTheDocument();
    });
  });

  describe("edge case: exactly average rating (diff = 0)", () => {
    it("shows Right on average message", async () => {
      // avgRating 3.5 falls into Belly Rub Expert range (3.5 to <4.2)
      setupFetchMocks({
        stats: {
          success: true,
          data: {
            ratingsCount: 50,
            skipsCount: 5,
            avgRatingGiven: 3.5,
            firstRatingAt: "2024-01-01T10:00:00Z",
            lastRatingAt: "2024-12-01T15:30:00Z",
            globalAvgRating: 3.5,
            ratingDiffFromGlobal: 0,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          // 3.5 is in Belly Rub Expert range [3.5, 4.2)
          expect(screen.getByText("Belly Rub Expert")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await waitFor(() => {
        expect(screen.getByText("Right on average")).toBeInTheDocument();
      });
    });
  });

  describe("edge case: all achievements unlocked", () => {
    it("shows all achievements as unlocked", async () => {
      setupFetchMocks({
        achievements: {
          success: true,
          data: {
            milestones: {
              current: 100,
              nextMilestone: 250,
              nextMilestoneName: "Dog Whisperer",
              progressPercent: 40,
              completedMilestones: [
                "first_rating",
                "getting_started",
                "dedicated_rater",
                "century_club",
              ],
            },
            achievements: [
              {
                id: "perfect_score",
                name: "Perfect Score",
                icon: "⭐",
                description: "Found the perfect pup!",
                criteria: "Give a 5.0 rating",
                unlocked: true,
                unlockedAt: "2024-01-01",
              },
              {
                id: "breed_explorer",
                name: "Breed Explorer",
                icon: "🗺️",
                description: "A true connoisseur",
                criteria: "Rate 10+ breeds",
                unlocked: true,
                unlockedAt: "2024-02-01",
              },
              {
                id: "variety_pack",
                name: "Variety Pack",
                icon: "🎨",
                description: "Used full spectrum",
                criteria: "Use all ratings",
                unlocked: true,
                unlockedAt: "2024-03-01",
              },
              {
                id: "early_bird",
                name: "Early Bird",
                icon: "🐦",
                description: "Quick rater",
                criteria: "5 in 30 min",
                unlocked: true,
                unlockedAt: "2024-04-01",
              },
              {
                id: "streak_master",
                name: "Streak Master",
                icon: "🔥",
                description: "Week of woofs",
                criteria: "7 day streak",
                unlocked: true,
                unlockedAt: "2024-05-01",
              },
              {
                id: "all_star_rater",
                name: "All-Star Rater",
                icon: "💖",
                description: "Spreading love",
                criteria: "20+ high ratings",
                unlocked: true,
                unlockedAt: "2024-06-01",
              },
              {
                id: "tough_crowd",
                name: "Tough Crowd",
                icon: "😬",
                description: "Honest opinions",
                criteria: "Low rating",
                unlocked: true,
                unlockedAt: "2024-07-01",
              },
            ],
            unlockedCount: 7,
            totalAchievements: 7,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("7/7 unlocked")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("edge case: single breed rated", () => {
    it("handles single breed in top breeds", async () => {
      setupFetchMocks({
        topBreeds: {
          success: true,
          data: {
            items: [
              {
                id: 1,
                name: "Poodle",
                slug: "poodle",
                avgRating: 4.2,
                ratingCount: 5,
                imageUrl: "https://example.com/poodle.jpg",
              },
            ],
            totalBreedsRated: 1,
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Poodle")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("edge case: dog without name in recent", () => {
    it("shows breed name when dog name is null", async () => {
      setupFetchMocks({
        recent: {
          success: true,
          data: {
            items: [
              {
                dogId: 1,
                dogName: null,
                breedName: "Shiba Inu",
                imageUrl: "https://example.com/shiba.jpg",
                rating: 4.5,
                ratedAt: "2024-12-01T15:30:00Z",
              },
            ],
          },
        },
      });

      renderWithRouter(<StatsPage />);

      await waitFor(
        () => {
          expect(screen.getByText("Shiba Inu")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });
});
