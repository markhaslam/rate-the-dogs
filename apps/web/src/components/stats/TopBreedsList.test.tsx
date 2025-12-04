import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBreedsList, TopBreedsListSkeleton } from "./TopBreedsList";
import type { TopBreed } from "@rate-the-dogs/shared";

const mockBreeds: TopBreed[] = [
  {
    id: 1,
    name: "Golden Retriever",
    slug: "golden-retriever",
    avgRating: 4.8,
    ratingCount: 25,
    imageUrl: "https://example.com/golden.jpg",
  },
  {
    id: 2,
    name: "Labrador",
    slug: "labrador",
    avgRating: 4.5,
    ratingCount: 18,
    imageUrl: "https://example.com/lab.jpg",
  },
  {
    id: 3,
    name: "German Shepherd",
    slug: "german-shepherd",
    avgRating: 4.3,
    ratingCount: 12,
    imageUrl: "https://example.com/shepherd.jpg",
  },
  {
    id: 4,
    name: "Beagle",
    slug: "beagle",
    avgRating: 4.0,
    ratingCount: 8,
    imageUrl: null,
  },
];

describe("TopBreedsList", () => {
  describe("rendering", () => {
    it("renders the header", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("Your Favorite Breeds")).toBeInTheDocument();
    });

    it("displays total breeds rated count", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("10 breeds rated")).toBeInTheDocument();
    });

    it("renders all breed items", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("Golden Retriever")).toBeInTheDocument();
      expect(screen.getByText("Labrador")).toBeInTheDocument();
      expect(screen.getByText("German Shepherd")).toBeInTheDocument();
      expect(screen.getByText("Beagle")).toBeInTheDocument();
    });
  });

  describe("medal badges", () => {
    it("shows gold medal for first place", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("🥇")).toBeInTheDocument();
    });

    it("shows silver medal for second place", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("🥈")).toBeInTheDocument();
    });

    it("shows bronze medal for third place", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("🥉")).toBeInTheDocument();
    });

    it("shows numeric rank for places beyond top 3", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("#4")).toBeInTheDocument();
    });
  });

  describe("gradient backgrounds (Tailwind JIT fix)", () => {
    it("applies static gradient classes to top 3 breeds", () => {
      const { container } = render(
        <TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />
      );

      // Check that medal backgrounds use static Tailwind classes
      // These should be full class strings, not dynamic interpolation
      const goldBg = container.querySelector(
        ".bg-gradient-to-r.from-yellow-400\\/10.to-amber-500\\/10"
      );
      expect(goldBg).toBeInTheDocument();

      const silverBg = container.querySelector(
        ".bg-gradient-to-r.from-gray-300\\/10.to-gray-400\\/10"
      );
      expect(silverBg).toBeInTheDocument();

      const bronzeBg = container.querySelector(
        ".bg-gradient-to-r.from-orange-400\\/10.to-orange-500\\/10"
      );
      expect(bronzeBg).toBeInTheDocument();
    });

    it("does not apply gradient to breeds beyond top 3", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      // 4th place (Beagle) should not have a gradient background
      // Find the row containing #4
      const rankFour = screen.getByText("#4");
      const beagleRow = rankFour.closest(".flex.items-center.gap-3");

      // Row should not have gradient class
      expect(beagleRow?.className).not.toContain("bg-gradient-to-r");
    });
  });

  describe("rating information", () => {
    it("displays average rating for each breed", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("4.8")).toBeInTheDocument();
      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("4.3")).toBeInTheDocument();
      expect(screen.getByText("4.0")).toBeInTheDocument();
    });

    it("displays rating count for each breed", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      expect(screen.getByText("25 ratings")).toBeInTheDocument();
      expect(screen.getByText("18 ratings")).toBeInTheDocument();
      expect(screen.getByText("12 ratings")).toBeInTheDocument();
      expect(screen.getByText("8 ratings")).toBeInTheDocument();
    });

    it("uses singular 'rating' for count of 1", () => {
      const singleRatingBreed: TopBreed[] = [
        {
          id: 1,
          name: "Poodle",
          slug: "poodle",
          avgRating: 5.0,
          ratingCount: 1,
          imageUrl: null,
        },
      ];

      render(<TopBreedsList breeds={singleRatingBreed} totalBreedsRated={1} />);

      expect(screen.getByText("1 rating")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no breeds", () => {
      render(<TopBreedsList breeds={[]} totalBreedsRated={0} />);

      expect(screen.getByText("No breeds rated yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start rating dogs to see your favorites!")
      ).toBeInTheDocument();
    });

    it("does not show total count when no breeds", () => {
      render(<TopBreedsList breeds={[]} totalBreedsRated={0} />);

      // The "X breeds rated" counter should not appear (matches pattern like "10 breeds rated")
      expect(screen.queryByText(/\d+ breeds rated/)).not.toBeInTheDocument();
    });
  });

  describe("images", () => {
    it("renders breed images with correct src", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute(
        "src",
        "https://example.com/golden.jpg"
      );
    });

    it("uses fallback URL for null imageUrl", () => {
      render(<TopBreedsList breeds={mockBreeds} totalBreedsRated={10} />);

      const images = screen.getAllByRole("img");
      // 4th breed (Beagle) has null imageUrl
      expect(images[3]).toHaveAttribute(
        "src",
        expect.stringContaining("placedog.net")
      );
    });
  });
});

describe("TopBreedsListSkeleton", () => {
  it("renders loading skeleton", () => {
    render(<TopBreedsListSkeleton />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders 3 placeholder items", () => {
    const { container } = render(<TopBreedsListSkeleton />);

    // Should have 3 skeleton breed rows
    const rows = container.querySelectorAll(".flex.items-center.gap-3");
    expect(rows).toHaveLength(3);
  });
});
