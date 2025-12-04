import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RaterPersonality, RaterPersonalitySkeleton } from "./RaterPersonality";

describe("RaterPersonality", () => {
  describe("locked state (< 10 ratings)", () => {
    it("shows Puppy Trainee for users with less than 10 ratings", () => {
      render(<RaterPersonality ratingsCount={5} avgRating={4.0} />);

      expect(screen.getByText("Puppy Trainee")).toBeInTheDocument();
      expect(screen.getByText(/Still learning the ropes/)).toBeInTheDocument();
    });

    it("shows how many more ratings needed to unlock", () => {
      render(<RaterPersonality ratingsCount={3} avgRating={4.0} />);

      expect(
        screen.getByText(/Rate 7 more dogs to unlock your personality/)
      ).toBeInTheDocument();
    });

    it("shows Puppy Trainee icon", () => {
      render(<RaterPersonality ratingsCount={5} avgRating={4.0} />);

      expect(screen.getByText("🐾")).toBeInTheDocument();
    });
  });

  describe("Treat Dispenser (avg >= 4.2)", () => {
    it("shows Treat Dispenser for generous raters", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={4.5} />);

      expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
      expect(
        screen.getByText(/Every pup deserves a treat/)
      ).toBeInTheDocument();
    });

    it("shows bone icon for Treat Dispenser", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={4.5} />);

      expect(screen.getByText("🦴")).toBeInTheDocument();
    });

    it("shows Treat Dispenser at exactly 4.2 average", () => {
      render(<RaterPersonality ratingsCount={20} avgRating={4.2} />);

      expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
    });
  });

  describe("Belly Rub Expert (avg 3.5-4.2)", () => {
    it("shows Belly Rub Expert for moderate raters", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={3.8} />);

      expect(screen.getByText("Belly Rub Expert")).toBeInTheDocument();
      expect(
        screen.getByText(/Knows exactly where to scratch/)
      ).toBeInTheDocument();
    });

    it("shows dog icon for Belly Rub Expert", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={3.8} />);

      expect(screen.getByText("🐕")).toBeInTheDocument();
    });
  });

  describe("Bark Inspector (avg 2.5-3.5)", () => {
    it("shows Bark Inspector for neutral raters", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={3.0} />);

      expect(screen.getByText("Bark Inspector")).toBeInTheDocument();
      expect(
        screen.getByText(/Investigating all the good boys/)
      ).toBeInTheDocument();
    });

    it("shows magnifying glass icon for Bark Inspector", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={3.0} />);

      expect(screen.getByText("🔍")).toBeInTheDocument();
    });
  });

  describe("Picky Pup Parent (avg < 2.5)", () => {
    it("shows Picky Pup Parent for critical raters", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={2.0} />);

      expect(screen.getByText("Picky Pup Parent")).toBeInTheDocument();
      expect(
        screen.getByText(/Only the finest floofs allowed/)
      ).toBeInTheDocument();
    });

    it("shows crown icon for Picky Pup Parent", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={2.0} />);

      expect(screen.getByText("👑")).toBeInTheDocument();
    });
  });

  describe("Top Dog bonus (100+ ratings)", () => {
    it("shows Top Dog badge for users with 100+ ratings", () => {
      render(<RaterPersonality ratingsCount={150} avgRating={3.8} />);

      expect(screen.getByText("Top Dog")).toBeInTheDocument();
    });

    it("shows trophy icon for Top Dog", () => {
      render(<RaterPersonality ratingsCount={150} avgRating={3.8} />);

      // Trophy appears twice - once in crown position, once in badge
      const trophies = screen.getAllByText("🏆");
      expect(trophies.length).toBeGreaterThanOrEqual(1);
    });

    it("shows personality AND Top Dog badge together", () => {
      render(<RaterPersonality ratingsCount={150} avgRating={4.5} />);

      // Should show both Treat Dispenser personality AND Top Dog badge
      expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
      expect(screen.getByText("Top Dog")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles null avgRating gracefully", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={null} />);

      // Should fall back to Puppy Trainee when avgRating is null
      expect(screen.getByText("Puppy Trainee")).toBeInTheDocument();
    });

    it("handles exactly 10 ratings (unlocked threshold)", () => {
      render(<RaterPersonality ratingsCount={10} avgRating={4.5} />);

      // Should show actual personality, not locked state
      expect(screen.getByText("Treat Dispenser")).toBeInTheDocument();
      expect(
        screen.queryByText(/Rate.*more dogs to unlock/)
      ).not.toBeInTheDocument();
    });

    it("handles exactly 100 ratings (Top Dog threshold)", () => {
      render(<RaterPersonality ratingsCount={100} avgRating={3.8} />);

      expect(screen.getByText("Top Dog")).toBeInTheDocument();
    });

    it("handles boundary between Bark Inspector and Belly Rub Expert (3.5)", () => {
      render(<RaterPersonality ratingsCount={50} avgRating={3.5} />);

      // At exactly 3.5, should be Belly Rub Expert (minAvg inclusive)
      expect(screen.getByText("Belly Rub Expert")).toBeInTheDocument();
    });
  });

  describe("gradient backgrounds (Tailwind JIT fix)", () => {
    it("applies static gradient class for Puppy Trainee", () => {
      const { container } = render(
        <RaterPersonality ratingsCount={5} avgRating={4.0} />
      );

      const gradient = container.querySelector(
        ".bg-gradient-to-br.from-gray-400.to-gray-500"
      );
      expect(gradient).toBeInTheDocument();
    });

    it("applies static gradient class for Treat Dispenser", () => {
      const { container } = render(
        <RaterPersonality ratingsCount={50} avgRating={4.5} />
      );

      const gradient = container.querySelector(
        ".bg-gradient-to-br.from-pink-400.to-rose-500"
      );
      expect(gradient).toBeInTheDocument();
    });

    it("applies static gradient class for Belly Rub Expert", () => {
      const { container } = render(
        <RaterPersonality ratingsCount={50} avgRating={3.8} />
      );

      const gradient = container.querySelector(
        ".bg-gradient-to-br.from-blue-400.to-cyan-500"
      );
      expect(gradient).toBeInTheDocument();
    });

    it("applies static gradient class for Bark Inspector", () => {
      const { container } = render(
        <RaterPersonality ratingsCount={50} avgRating={3.0} />
      );

      const gradient = container.querySelector(
        ".bg-gradient-to-br.from-purple-400.to-violet-500"
      );
      expect(gradient).toBeInTheDocument();
    });

    it("applies static gradient class for Picky Pup Parent", () => {
      const { container } = render(
        <RaterPersonality ratingsCount={50} avgRating={2.0} />
      );

      const gradient = container.querySelector(
        ".bg-gradient-to-br.from-amber-400.to-yellow-500"
      );
      expect(gradient).toBeInTheDocument();
    });

    it("uses static mapping instead of dynamic personality.color", () => {
      const { container } = render(
        <RaterPersonality ratingsCount={50} avgRating={4.5} />
      );

      // The gradient div should exist with proper static classes
      const gradientDiv = container.querySelector(
        ".absolute.inset-0.opacity-10.bg-gradient-to-br"
      );
      expect(gradientDiv).toBeInTheDocument();

      // Should NOT have broken dynamic class (would be empty or missing)
      expect(gradientDiv?.className).toContain("from-");
      expect(gradientDiv?.className).toContain("to-");
    });
  });
});

describe("RaterPersonalitySkeleton", () => {
  it("renders loading skeleton", () => {
    render(<RaterPersonalitySkeleton />);

    // Should have animated pulse elements
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders icon placeholder", () => {
    render(<RaterPersonalitySkeleton />);

    const iconPlaceholder = document.querySelector(".rounded-full");
    expect(iconPlaceholder).toBeInTheDocument();
  });
});
