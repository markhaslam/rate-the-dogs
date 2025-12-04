import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MilestoneProgress,
  MilestoneProgressSkeleton,
} from "./MilestoneProgress";
import { MILESTONES } from "@rate-the-dogs/shared";

describe("MilestoneProgress", () => {
  describe("header rendering", () => {
    it("renders the milestone progress title", () => {
      render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      expect(screen.getByText("Milestone Progress")).toBeInTheDocument();
    });

    it("displays current ratings count in badge", () => {
      render(
        <MilestoneProgress
          current={42}
          nextMilestone={50}
          nextMilestoneName="Dedicated Rater"
          progressPercent={84}
          completedMilestones={[1, 10]}
        />
      );

      expect(screen.getByText("42 ratings")).toBeInTheDocument();
    });
  });

  describe("milestone markers", () => {
    it("renders all milestone markers", () => {
      render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      // Should have milestone circles for each milestone count
      MILESTONES.forEach((milestone) => {
        const markerTitle = `${milestone.name}: ${milestone.count} ratings`;
        expect(screen.getByTitle(markerTitle)).toBeInTheDocument();
      });
    });

    it("shows completed milestones with icons", () => {
      render(
        <MilestoneProgress
          current={15}
          nextMilestone={50}
          nextMilestoneName="Dedicated Rater"
          progressPercent={30}
          completedMilestones={[1, 10]}
        />
      );

      // Completed milestones show their emoji icons
      expect(screen.getByText("🎉")).toBeInTheDocument(); // First Rating
      expect(screen.getByText("🌟")).toBeInTheDocument(); // Getting Started
    });

    it("shows uncompleted milestones with count numbers", () => {
      render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      // Uncompleted milestones show their count
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("positions milestone markers using absolute positioning", () => {
      const { container } = render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      // Check that milestone markers have position styles
      const markers = container.querySelectorAll('[title*="ratings"]');
      markers.forEach((marker) => {
        const parent = marker.closest("[style]");
        expect(parent).toBeTruthy();
        expect(parent?.getAttribute("style")).toContain("left:");
        expect(parent?.getAttribute("style")).toContain("translateX(-50%)");
      });
    });

    it("does not use broken marginLeft positioning", () => {
      const { container } = render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      // Ensure no negative percentages in styles (the old bug)
      const allElements = container.querySelectorAll("[style]");
      allElements.forEach((el) => {
        const style = el.getAttribute("style") || "";
        // Should not have negative margin-left percentages
        expect(style).not.toMatch(/margin-left:\s*-\d/);
      });
    });
  });

  describe("progress bar", () => {
    it("renders progress bar with correct width", () => {
      const { container } = render(
        <MilestoneProgress
          current={25}
          nextMilestone={50}
          nextMilestoneName="Dedicated Rater"
          progressPercent={50}
          completedMilestones={[1, 10]}
        />
      );

      const progressFill = container.querySelector('[style*="width: 50%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it("caps progress bar at 100%", () => {
      const { container } = render(
        <MilestoneProgress
          current={600}
          nextMilestone={null}
          nextMilestoneName={null}
          progressPercent={120}
          completedMilestones={[1, 10, 50, 100, 250, 500]}
        />
      );

      const progressFill = container.querySelector('[style*="width: 100%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it("shows different gradient when all completed", () => {
      const { container } = render(
        <MilestoneProgress
          current={500}
          nextMilestone={null}
          nextMilestoneName={null}
          progressPercent={100}
          completedMilestones={[1, 10, 50, 100, 250, 500]}
        />
      );

      // All completed state has special gradient including red
      const progressFill = container.querySelector(
        ".from-amber-400.via-orange-400.to-red-400"
      );
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe("next milestone message", () => {
    it("shows remaining count to next milestone", () => {
      render(
        <MilestoneProgress
          current={45}
          nextMilestone={50}
          nextMilestoneName="Dedicated Rater"
          progressPercent={90}
          completedMilestones={[1, 10]}
        />
      );

      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText(/more to reach/)).toBeInTheDocument();
      expect(screen.getByText("Dedicated Rater")).toBeInTheDocument();
    });

    it("shows completion message when all milestones done", () => {
      render(
        <MilestoneProgress
          current={500}
          nextMilestone={null}
          nextMilestoneName={null}
          progressPercent={100}
          completedMilestones={[1, 10, 50, 100, 250, 500]}
        />
      );

      expect(screen.getByText(/All milestones completed/)).toBeInTheDocument();
      // 👑 appears in both milestone icon and completion message
      const crowns = screen.getAllByText("👑");
      expect(crowns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("responsive design", () => {
    it("has overflow-hidden to prevent marker overflow", () => {
      const { container } = render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      const card = container.querySelector(".overflow-hidden");
      expect(card).toBeInTheDocument();
    });

    it("uses responsive padding classes", () => {
      const { container } = render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      // Should have responsive padding (p-4 sm:p-6)
      const card = container.querySelector(".p-4.sm\\:p-6");
      expect(card).toBeInTheDocument();
    });

    it("uses responsive text sizes", () => {
      const { container } = render(
        <MilestoneProgress
          current={5}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={50}
          completedMilestones={[1]}
        />
      );

      // Header should have responsive text
      const header = container.querySelector(".text-sm.sm\\:text-base");
      expect(header).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles zero current ratings", () => {
      render(
        <MilestoneProgress
          current={0}
          nextMilestone={1}
          nextMilestoneName="First Rating"
          progressPercent={0}
          completedMilestones={[]}
        />
      );

      expect(screen.getByText("0 ratings")).toBeInTheDocument();
      // "1" appears in milestone marker - check the message instead
      expect(screen.getByText(/more to reach/)).toBeInTheDocument();
      expect(screen.getByText("First Rating")).toBeInTheDocument();
    });

    it("handles single completed milestone", () => {
      render(
        <MilestoneProgress
          current={1}
          nextMilestone={10}
          nextMilestoneName="Getting Started"
          progressPercent={10}
          completedMilestones={[1]}
        />
      );

      expect(screen.getByText("🎉")).toBeInTheDocument();
      // Check remaining count in the message
      expect(screen.getByText("9")).toBeInTheDocument();
    });
  });
});

describe("MilestoneProgressSkeleton", () => {
  it("renders loading skeleton", () => {
    render(<MilestoneProgressSkeleton />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders skeleton milestone markers", () => {
    const { container } = render(<MilestoneProgressSkeleton />);

    // Should have 6 skeleton circles for milestones
    const circles = container.querySelectorAll(
      ".rounded-full.bg-muted.animate-pulse"
    );
    expect(circles.length).toBeGreaterThanOrEqual(6);
  });

  it("has matching responsive classes as main component", () => {
    const { container } = render(<MilestoneProgressSkeleton />);

    // Should have same responsive padding
    const card = container.querySelector(".p-4.sm\\:p-6");
    expect(card).toBeInTheDocument();
  });

  it("renders progress bar skeleton", () => {
    const { container } = render(<MilestoneProgressSkeleton />);

    const progressBar = container.querySelector(
      ".h-2\\.5.sm\\:h-3.bg-muted.rounded-full"
    );
    expect(progressBar).toBeInTheDocument();
  });
});
