import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AchievementsBadges,
  AchievementsBadgesSkeleton,
} from "./AchievementsBadges";
import type { AchievementStatus } from "@rate-the-dogs/shared";

const mockAchievements: AchievementStatus[] = [
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
  {
    id: "variety_pack",
    name: "Variety Pack",
    icon: "🎨",
    description: "Used the full spectrum",
    criteria: "Use all rating values (0.5-5.0)",
    unlocked: false,
    unlockedAt: null,
  },
];

describe("AchievementsBadges", () => {
  describe("rendering", () => {
    it("renders the achievements header", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      expect(screen.getByText("Achievements")).toBeInTheDocument();
    });

    it("displays the unlock count", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      expect(screen.getByText("2/7 unlocked")).toBeInTheDocument();
    });

    it("renders all achievement badges", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      // Unlocked achievements show their icons (appear in badge + mobile list)
      const starIcons = screen.getAllByText("⭐");
      expect(starIcons.length).toBeGreaterThanOrEqual(1);

      const mapIcons = screen.getAllByText("🗺️");
      expect(mapIcons.length).toBeGreaterThanOrEqual(1);

      // Locked achievements show lock icon
      const locks = screen.getAllByText("🔒");
      expect(locks).toHaveLength(2);
    });
  });

  describe("unlocked achievements", () => {
    it("shows achievement name in mobile list for unlocked achievements", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      // Names appear in both tooltip and mobile list
      const perfectScores = screen.getAllByText("Perfect Score");
      expect(perfectScores.length).toBeGreaterThanOrEqual(1);

      const breedExplorers = screen.getAllByText("Breed Explorer");
      expect(breedExplorers.length).toBeGreaterThanOrEqual(1);
    });

    it("has correct title attribute for unlocked achievements", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      const achievementWithTitle = screen.getByTitle(
        "Perfect Score: Found the perfect pup!"
      );
      expect(achievementWithTitle).toBeInTheDocument();
    });
  });

  describe("locked achievements", () => {
    it("has correct title attribute for locked achievements", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      const lockedAchievement = screen.getByTitle(
        "Locked: Rate 7 days in a row"
      );
      expect(lockedAchievement).toBeInTheDocument();
    });

    it("does not show locked achievement names in mobile list", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      // Streak Master is locked, should not appear in the mobile list
      // The name only appears in the tooltip, not as direct text
      const mobileList = document.querySelector(".sm\\:hidden");
      expect(mobileList).not.toHaveTextContent("Streak Master");
    });
  });

  describe("empty state", () => {
    it("shows message when no achievements are unlocked", () => {
      const allLockedAchievements: AchievementStatus[] = mockAchievements.map(
        (a) => ({
          ...a,
          unlocked: false,
          unlockedAt: null,
        })
      );

      render(
        <AchievementsBadges
          achievements={allLockedAchievements}
          unlockedCount={0}
          totalAchievements={7}
        />
      );

      expect(
        screen.getByText("Keep rating to unlock achievements!")
      ).toBeInTheDocument();
    });
  });

  describe("tooltip content", () => {
    it("renders tooltip with achievement name and description", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      // The tooltip contains this text (hidden by default, shown on hover)
      expect(screen.getByText("Found the perfect pup!")).toBeInTheDocument();
      expect(
        screen.getByText("A true connoisseur of canine diversity")
      ).toBeInTheDocument();
    });

    it("renders tooltip with criteria for locked achievements", () => {
      render(
        <AchievementsBadges
          achievements={mockAchievements}
          unlockedCount={2}
          totalAchievements={7}
        />
      );

      // Locked achievement shows criteria in tooltip
      expect(screen.getByText("Rate 7 days in a row")).toBeInTheDocument();
    });
  });
});

describe("AchievementsBadgesSkeleton", () => {
  it("renders loading skeleton", () => {
    render(<AchievementsBadgesSkeleton />);

    // Should have animated pulse elements
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders 7 badge placeholders", () => {
    render(<AchievementsBadgesSkeleton />);

    const badgePlaceholders = document.querySelectorAll(
      ".aspect-square.rounded-xl"
    );
    expect(badgePlaceholders).toHaveLength(7);
  });
});
