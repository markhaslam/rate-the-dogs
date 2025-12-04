import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LeaderboardPage } from "./LeaderboardPage";

// Create a fresh mock fetch for each test
let mockFetch: ReturnType<typeof vi.fn>;

const mockDogsResponse = {
  success: true,
  data: {
    items: [
      {
        id: 1,
        name: "Charlie",
        image_url: "https://example.com/charlie.jpg",
        breed_name: "French Bulldog",
        avg_rating: 5.0,
        rating_count: 10,
      },
      {
        id: 2,
        name: "Cooper",
        image_url: "https://example.com/cooper.jpg",
        breed_name: "Corgi",
        avg_rating: 4.8,
        rating_count: 5,
      },
      {
        id: 3,
        name: "Luna",
        image_url: "https://example.com/luna.jpg",
        breed_name: "Husky",
        avg_rating: 4.0,
        rating_count: 3,
      },
      {
        id: 4,
        name: "Max",
        image_url: "https://example.com/max.jpg",
        breed_name: "Labrador",
        avg_rating: 3.5,
        rating_count: 2,
      },
    ],
  },
};

const mockBreedsResponse = {
  success: true,
  data: {
    items: [
      {
        id: 1,
        name: "French Bulldog",
        slug: "french-bulldog",
        avg_rating: 4.5,
        dog_count: 5,
        rating_count: 20,
      },
      {
        id: 2,
        name: "Corgi",
        slug: "corgi",
        avg_rating: 4.3,
        dog_count: 3,
        rating_count: 15,
      },
    ],
  },
};

describe("LeaderboardPage", () => {
  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  describe("rendering", () => {
    it("displays the leaderboard title", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      expect(screen.getByText("Leaderboard")).toBeInTheDocument();
      expect(
        screen.getByText("The most beloved dogs on the internet")
      ).toBeInTheDocument();

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(screen.getByText("Charlie")).toBeInTheDocument();
      });
    });

    it("shows loading skeletons initially", () => {
      mockFetch.mockReturnValue(new Promise((_resolve) => _resolve)); // Never resolves - keep pending

      render(<LeaderboardPage />);

      // Loading skeletons should be present
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("displays tab switcher with Top Dogs and Top Breeds", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      expect(screen.getByText("Top Dogs")).toBeInTheDocument();
      expect(screen.getByText("Top Breeds")).toBeInTheDocument();

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(screen.getByText("Charlie")).toBeInTheDocument();
      });
    });
  });

  describe("dogs tab", () => {
    it("fetches and displays dogs", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Charlie")).toBeInTheDocument();
      });

      expect(screen.getByText("French Bulldog")).toBeInTheDocument();
      expect(screen.getByText("5.0")).toBeInTheDocument();
    });

    it("displays medal emojis for top 3 dogs", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText("🥇")).toBeInTheDocument();
      });

      expect(screen.getByText("🥈")).toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("displays rank numbers for positions 4+", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText("#4")).toBeInTheDocument();
      });
    });

    it("shows empty state when no dogs", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: { items: [] },
          }),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText("No rated dogs yet. Be the first to rate!")
        ).toBeInTheDocument();
      });
    });

    it("displays singular rating text for 1 rating", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              items: [
                {
                  id: 1,
                  name: "Solo",
                  image_url: "https://example.com/solo.jpg",
                  breed_name: "Beagle",
                  avg_rating: 4.0,
                  rating_count: 1,
                },
              ],
            },
          }),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/1.*rating$/)).toBeInTheDocument();
      });
    });
  });

  describe("breeds tab", () => {
    it("switches to breeds tab and fetches breeds", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Charlie")).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      fireEvent.click(screen.getByText("Top Breeds"));

      await waitFor(() => {
        expect(screen.getByText("French Bulldog")).toBeInTheDocument();
      });

      expect(screen.getByText("Corgi")).toBeInTheDocument();
    });

    it("displays dog count for breeds", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      fireEvent.click(screen.getByText("Top Breeds"));

      await waitFor(() => {
        expect(screen.getByText(/5.*dogs/)).toBeInTheDocument();
      });
    });

    it("shows empty state when no breeds", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: { items: [] },
          }),
      });

      fireEvent.click(screen.getByText("Top Breeds"));

      await waitFor(() => {
        expect(
          screen.getByText("No rated breeds yet. Start rating some dogs!")
        ).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("handles fetch error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe("image error handling", () => {
    it("sets fallback image on error", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockDogsResponse),
      });

      render(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Charlie")).toBeInTheDocument();
      });

      const images = screen.getAllByRole("img");
      fireEvent.error(images[0]);

      expect(images[0]).toHaveAttribute(
        "src",
        "https://placedog.net/100/100?id=1"
      );
    });
  });
});
