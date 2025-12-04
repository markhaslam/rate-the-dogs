import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DogCard } from "./DogCard";

const mockDog = {
  id: 1,
  name: "Max",
  image_url: "https://placedog.net/500/500?id=1",
  breed_name: "Labrador Retriever",
  avg_rating: 4.5,
  rating_count: 10,
};

describe("DogCard", () => {
  describe("rendering", () => {
    it("displays breed name", () => {
      render(<DogCard dog={mockDog} />);
      expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
    });

    it("displays breed name for unnamed dog", () => {
      const unnamedDog = { ...mockDog, name: null };
      render(<DogCard dog={unnamedDog} />);
      expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
    });

    it("displays average rating when available", () => {
      render(<DogCard dog={mockDog} />);
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("displays rating count", () => {
      render(<DogCard dog={mockDog} />);
      expect(screen.getByText(/10.*ratings/)).toBeInTheDocument();
    });

    it("does not display rating when avg_rating is null", () => {
      const unratedDog = { ...mockDog, avg_rating: null };
      render(<DogCard dog={unratedDog} />);
      // Should not find the rating display
      expect(screen.queryByText(/10.*ratings/)).not.toBeInTheDocument();
    });

    it("renders dog image with correct src", () => {
      render(<DogCard dog={mockDog} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("src", mockDog.image_url);
    });

    it("renders dog image with alt text", () => {
      render(<DogCard dog={mockDog} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Max");
    });

    it("uses fallback alt text for unnamed dog", () => {
      const unnamedDog = { ...mockDog, name: null };
      render(<DogCard dog={unnamedDog} />);
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "A cute dog");
    });
  });

  describe("rating interaction", () => {
    it("shows rating UI when onRate provided", () => {
      const onRate = vi.fn();
      render(<DogCard dog={mockDog} onRate={onRate} />);
      // Text is dynamic: "How would you rate this good boy?" or "...good girl?"
      expect(
        screen.getByText(/How would you rate this good (boy|girl)\?/)
      ).toBeInTheDocument();
    });

    it("hides rating UI when showRating is false", () => {
      const onRate = vi.fn();
      render(<DogCard dog={mockDog} onRate={onRate} showRating={false} />);
      expect(
        screen.queryByText(/How would you rate this good (boy|girl)\?/)
      ).not.toBeInTheDocument();
    });

    it("hides rating UI when onRate not provided", () => {
      render(<DogCard dog={mockDog} />);
      expect(
        screen.queryByText(/How would you rate this good (boy|girl)\?/)
      ).not.toBeInTheDocument();
    });
  });

  describe("skip functionality", () => {
    it("shows skip button when onSkip provided", () => {
      const onSkip = vi.fn();
      render(<DogCard dog={mockDog} onSkip={onSkip} />);
      expect(screen.getByText("Skip this dog")).toBeInTheDocument();
    });

    it("hides skip button when onSkip not provided", () => {
      render(<DogCard dog={mockDog} />);
      expect(screen.queryByText("Skip this dog")).not.toBeInTheDocument();
    });

    it("calls onSkip when skip button clicked", () => {
      const onSkip = vi.fn();
      render(<DogCard dog={mockDog} onSkip={onSkip} />);

      fireEvent.click(screen.getByText("Skip this dog"));
      expect(onSkip).toHaveBeenCalled();
    });

    it("disables skip button when isRating is true", () => {
      const onSkip = vi.fn();
      render(<DogCard dog={mockDog} onSkip={onSkip} isRating />);

      const skipButton = screen.getByText("Skip this dog");
      expect(skipButton).toBeDisabled();
    });
  });

  describe("image error handling", () => {
    it("sets fallback image on error", () => {
      render(<DogCard dog={mockDog} />);
      const img = screen.getByRole("img");

      fireEvent.error(img);

      expect(img).toHaveAttribute(
        "src",
        `https://placedog.net/500/500?id=${mockDog.id}`
      );
    });
  });

  describe("edge cases", () => {
    it("handles zero rating count", () => {
      const zeroRatingsDog = {
        ...mockDog,
        breed_name: "Golden Retriever",
        rating_count: 0,
        avg_rating: null,
      };
      render(<DogCard dog={zeroRatingsDog} />);
      // Should not crash
      expect(screen.getByText("Golden Retriever")).toBeInTheDocument();
    });

    it("handles very long breed name", () => {
      const longBreedDog = {
        ...mockDog,
        breed_name: "Australian Shepherd Mix with Long Name",
      };
      render(<DogCard dog={longBreedDog} />);
      expect(
        screen.getByText("Australian Shepherd Mix with Long Name")
      ).toBeInTheDocument();
    });

    it("handles special characters in breed name", () => {
      const specialDog = {
        ...mockDog,
        breed_name: "St. Bernard & Poodle Mix",
      };
      render(<DogCard dog={specialDog} />);
      expect(screen.getByText("St. Bernard & Poodle Mix")).toBeInTheDocument();
    });
  });
});
