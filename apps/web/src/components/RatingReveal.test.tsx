import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RatingReveal } from "./RatingReveal";

describe("RatingReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders with the rating-reveal testid", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);
      expect(screen.getByTestId("rating-reveal")).toBeInTheDocument();
    });

    it("displays Average Rating label", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);
      expect(screen.getByText("Average Rating")).toBeInTheDocument();
    });

    it("displays rating count text", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);
      expect(screen.getByText(/Based on 10 ratings/)).toBeInTheDocument();
    });

    it("uses singular 'rating' for count of 1", () => {
      render(<RatingReveal rating={4.5} ratingCount={1} userRating={4.0} />);
      expect(screen.getByText(/Based on 1 rating$/)).toBeInTheDocument();
    });

    it("displays user rating", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);
      expect(screen.getByText("4.0")).toBeInTheDocument();
    });
  });

  describe("rating comparison text", () => {
    it("shows 'Right on the average!' when user rating matches average", () => {
      render(<RatingReveal rating={4.0} ratingCount={10} userRating={4.0} />);
      expect(screen.getByText(/Right on the average!/)).toBeInTheDocument();
    });

    it("shows 'above average' when user rating is higher", () => {
      render(<RatingReveal rating={3.5} ratingCount={10} userRating={4.5} />);
      expect(screen.getByText(/1.0 above average/)).toBeInTheDocument();
    });

    it("shows 'below average' when user rating is lower", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={3.5} />);
      expect(screen.getByText(/1.0 below average/)).toBeInTheDocument();
    });

    it("handles small differences as 'Right on the average!'", () => {
      // 0.05 difference should be treated as "on the average"
      render(<RatingReveal rating={4.0} ratingCount={10} userRating={4.05} />);
      expect(screen.getByText(/Right on the average!/)).toBeInTheDocument();
    });
  });

  describe("animation phases", () => {
    it("starts in enter phase with opacity-0", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);
      const overlay = screen.getByTestId("rating-reveal");
      expect(overlay.className).toContain("opacity-0");
    });

    it("transitions to counting phase after 100ms", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const overlay = screen.getByTestId("rating-reveal");
      expect(overlay.className).toContain("opacity-100");
    });
  });

  describe("onComplete callback", () => {
    it("calls onComplete after animation completes", async () => {
      // Use real timers for this test since requestAnimationFrame doesn't work well with fake timers
      vi.useRealTimers();

      const onComplete = vi.fn();
      render(
        <RatingReveal
          rating={4.5}
          ratingCount={10}
          userRating={4.0}
          onComplete={onComplete}
        />
      );

      // Wait for enter phase + counting animation + completion delay
      // 100ms + 800ms + 1500ms + buffer = ~2500ms
      await new Promise((resolve) => setTimeout(resolve, 2600));

      expect(onComplete).toHaveBeenCalled();
    });

    it("does not crash when onComplete is not provided", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);

      // Advance through all animation phases
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not throw
      expect(screen.getByTestId("rating-reveal")).toBeInTheDocument();
    });

    it("calls onComplete when clicked (skip animation)", async () => {
      const onComplete = vi.fn();
      vi.useRealTimers(); // Need real timers for fireEvent

      render(
        <RatingReveal
          rating={4.5}
          ratingCount={10}
          userRating={4.0}
          onComplete={onComplete}
        />
      );

      const overlay = screen.getByTestId("rating-reveal");
      overlay.click();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("only calls onComplete once even with multiple clicks", async () => {
      const onComplete = vi.fn();
      vi.useRealTimers(); // Need real timers for fireEvent

      render(
        <RatingReveal
          rating={4.5}
          ratingCount={10}
          userRating={4.0}
          onComplete={onComplete}
        />
      );

      const overlay = screen.getByTestId("rating-reveal");
      overlay.click();
      overlay.click();
      overlay.click();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("confetti particles", () => {
    it("renders 12 confetti particles", () => {
      render(<RatingReveal rating={4.5} ratingCount={10} userRating={4.0} />);

      // Particles have the animate-confetti or opacity-0 class
      const overlay = screen.getByTestId("rating-reveal");
      const particles = overlay.querySelectorAll(".rounded-full.absolute");
      expect(particles.length).toBe(12);
    });
  });

  describe("edge cases", () => {
    it("handles zero rating", () => {
      render(<RatingReveal rating={0} ratingCount={10} userRating={2.5} />);
      expect(screen.getByTestId("rating-reveal")).toBeInTheDocument();
    });

    it("handles max rating (5.0)", () => {
      render(<RatingReveal rating={5.0} ratingCount={10} userRating={5.0} />);
      expect(screen.getByTestId("rating-reveal")).toBeInTheDocument();
    });

    it("handles very high rating count", () => {
      render(
        <RatingReveal rating={4.2} ratingCount={99999} userRating={4.0} />
      );
      expect(screen.getByText(/Based on 99999 ratings/)).toBeInTheDocument();
    });

    it("handles decimal ratings correctly", () => {
      render(<RatingReveal rating={3.75} ratingCount={10} userRating={4.25} />);
      expect(screen.getByText("4.3")).toBeInTheDocument(); // 4.25 formatted
    });
  });
});
