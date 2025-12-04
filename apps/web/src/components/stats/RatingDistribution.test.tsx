import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  RatingDistribution,
  RatingDistributionSkeleton,
} from "./RatingDistribution";

const mockDistribution: Record<string, number> = {
  "5": 15,
  "4.5": 8,
  "4": 12,
  "3.5": 5,
  "3": 3,
  "2.5": 1,
  "2": 0,
  "1.5": 0,
  "1": 1,
  "0.5": 0,
};

describe("RatingDistribution", () => {
  describe("rendering", () => {
    it("renders the header", () => {
      render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      expect(screen.getByText("Your Rating Style")).toBeInTheDocument();
    });

    it("displays total ratings count", () => {
      render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      expect(screen.getByText("45 total")).toBeInTheDocument();
    });

    it("renders all rating value labels", () => {
      render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      // All rating values should be shown
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("3.5")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2.5")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1.5")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("0.5")).toBeInTheDocument();
    });
  });

  describe("mode rating", () => {
    it("highlights the mode rating with Favorite label", () => {
      render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      expect(screen.getByText("Favorite")).toBeInTheDocument();
    });

    it("applies special styling to mode rating bar", () => {
      const { container } = render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      // Mode rating should have gradient styling
      const gradientBar = container.querySelector(
        ".bg-gradient-to-r.from-primary.to-amber-500"
      );
      expect(gradientBar).toBeInTheDocument();
    });
  });

  describe("percentages", () => {
    it("displays percentage for non-zero counts", () => {
      render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      // 15 out of 45 = 33%
      expect(screen.getByText("33%")).toBeInTheDocument();
    });

    it("displays dash for zero counts", () => {
      render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      // Zero counts should show "—"
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe("bar widths", () => {
    it("scales bar widths relative to max count", () => {
      const { container } = render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      // Highest count (15) should have 100% width
      const bars = container.querySelectorAll("[style*='width']");
      let has100Percent = false;
      bars.forEach((bar) => {
        if (bar.getAttribute("style")?.includes("width: 100%")) {
          has100Percent = true;
        }
      });
      expect(has100Percent).toBe(true);
    });
  });

  describe("empty state", () => {
    it("shows empty message when no ratings", () => {
      render(
        <RatingDistribution
          distribution={{}}
          modeRating={null}
          totalRatings={0}
        />
      );

      expect(screen.getByText("No ratings yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start rating to see your pattern!")
      ).toBeInTheDocument();
    });

    it("does not show total count when empty", () => {
      render(
        <RatingDistribution
          distribution={{}}
          modeRating={null}
          totalRatings={0}
        />
      );

      expect(screen.queryByText(/total/)).not.toBeInTheDocument();
    });
  });

  describe("mobile responsiveness", () => {
    it("uses flexible layout for bars", () => {
      const { container } = render(
        <RatingDistribution
          distribution={mockDistribution}
          modeRating={5}
          totalRatings={45}
        />
      );

      // Bar containers should use flex-1 for responsiveness
      const flexBars = container.querySelectorAll(".flex-1");
      expect(flexBars.length).toBeGreaterThan(0);
    });
  });
});

describe("RatingDistributionSkeleton", () => {
  it("renders loading skeleton", () => {
    render(<RatingDistributionSkeleton />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders all 10 rating value labels", () => {
    render(<RatingDistributionSkeleton />);

    // Should show the rating value labels even in skeleton
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
  });

  it("renders skeleton bars for each rating", () => {
    const { container } = render(<RatingDistributionSkeleton />);

    const skeletonBars = container.querySelectorAll(
      ".flex-1.h-6.bg-muted.rounded-full"
    );
    expect(skeletonBars).toHaveLength(10);
  });
});
