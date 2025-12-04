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

    it("hides average rating before user rates (to avoid influencing)", () => {
      // Rating is intentionally hidden before user rates
      render(<DogCard dog={mockDog} />);
      expect(screen.queryByText("4.5")).not.toBeInTheDocument();
    });

    it("hides rating count before user rates", () => {
      // Rating count is hidden to avoid influencing user
      render(<DogCard dog={mockDog} />);
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

  describe("rating reveal", () => {
    it("shows rating reveal overlay when revealedRating is provided", () => {
      const revealedRating = {
        avgRating: 4.2,
        ratingCount: 15,
        userRating: 4.5,
      };
      render(<DogCard dog={mockDog} revealedRating={revealedRating} />);
      expect(screen.getByTestId("rating-reveal")).toBeInTheDocument();
    });

    it("does not show rating reveal overlay when revealedRating is null", () => {
      render(<DogCard dog={mockDog} revealedRating={null} />);
      expect(screen.queryByTestId("rating-reveal")).not.toBeInTheDocument();
    });

    it("does not show rating reveal overlay when revealedRating is undefined", () => {
      render(<DogCard dog={mockDog} />);
      expect(screen.queryByTestId("rating-reveal")).not.toBeInTheDocument();
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

  describe("image slide-over transition", () => {
    it("renders single image by default (no animation)", () => {
      render(<DogCard dog={mockDog} />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
      expect(images[0].className).toContain("object-cover");
    });

    it("renders single image when not sliding", () => {
      render(<DogCard dog={mockDog} imageTransition="idle" />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
    });

    it("renders two images when sliding with previousImageUrl", () => {
      render(
        <DogCard
          dog={mockDog}
          imageTransition="enter"
          previousImageUrl="https://example.com/prev-dog.jpg"
        />
      );
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);

      // First image is the previous one (underneath)
      expect(images[0]).toHaveAttribute(
        "src",
        "https://example.com/prev-dog.jpg"
      );
      expect(images[0]).toHaveAttribute("alt", "Previous dog");

      // Second image is the current one with slide animation
      expect(images[1]).toHaveAttribute("src", mockDog.image_url);
    });

    it("applies slide-in animation class when sliding", () => {
      render(
        <DogCard
          dog={mockDog}
          imageTransition="enter"
          previousImageUrl="https://example.com/prev-dog.jpg"
        />
      );
      const images = screen.getAllByRole("img");
      const currentImage = images[1];
      expect(currentImage.className).toContain("animate-slide-in-right");
      expect(currentImage.className).toContain("absolute");
    });

    it("does not show previous image without previousImageUrl", () => {
      render(<DogCard dog={mockDog} imageTransition="enter" />);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
    });

    it("does not show previous image when idle", () => {
      render(
        <DogCard
          dog={mockDog}
          imageTransition="idle"
          previousImageUrl="https://example.com/prev-dog.jpg"
        />
      );
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(1);
    });

    it("preserves core image classes", () => {
      render(<DogCard dog={mockDog} />);
      const img = screen.getByRole("img");
      expect(img.className).toContain("object-cover");
      expect(img.className).toContain("w-full");
      expect(img.className).toContain("h-full");
    });
  });
});
