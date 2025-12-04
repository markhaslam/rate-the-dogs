import { test, expect } from "@playwright/test";

test.describe("Stats Page", () => {
  test("shows empty state for new user", async ({ page, context }) => {
    // Clear cookies to simulate a new user
    await context.clearCookies();

    // Navigate to stats page
    await page.goto("/stats");

    // Should show empty state message
    await expect(page.getByText("No Stats Yet!")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("Start rating dogs to unlock your personal stats")
    ).toBeVisible();

    // Should have a CTA button to start rating
    await expect(
      page.getByRole("link", { name: /start rating/i })
    ).toBeVisible();
  });

  test("can navigate to stats page from navigation", async ({ page }) => {
    // Go to home page first
    await page.goto("/");

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Click on "My Stats" in navigation
    await page.getByRole("link", { name: /my stats/i }).click();

    // Should be on stats page
    await expect(page).toHaveURL(/\/stats/);

    // Should see the page header
    await expect(page.getByRole("heading", { name: /my stats/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows stats after rating a dog", async ({ page }) => {
    // First rate a dog
    await page.goto("/");

    // Wait for rating buttons to load
    await page.waitForSelector('[role="group"][aria-label="Rating"]', {
      timeout: 10000,
    });

    // Click on a bone to rate (5 stars)
    const bones = page.locator('[role="group"][aria-label="Rating"] button');
    await bones.nth(4).click(); // Rate 5

    // Wait for reveal and dismiss
    const reveal = page.locator('[data-testid="rating-reveal"]');
    await expect(reveal).toBeVisible({ timeout: 5000 });
    await reveal.click();
    await expect(reveal).not.toBeVisible({ timeout: 3000 });

    // Now navigate to stats page
    await page.goto("/stats");

    // Should NOT show empty state
    await expect(page.getByText("No Stats Yet!")).not.toBeVisible({
      timeout: 5000,
    });

    // Should show the milestone progress
    await expect(page.getByText("Milestone Progress")).toBeVisible({
      timeout: 5000,
    });

    // Should show rating stats (at least 1 rated)
    await expect(page.getByText(/Dogs Rated/i)).toBeVisible();

    // Should show personality section
    await expect(page.getByText("Puppy Trainee")).toBeVisible();

    // Should show achievements section
    await expect(page.getByText("Achievements")).toBeVisible();

    // Perfect Score achievement should be unlocked (we gave 5 stars)
    await expect(page.getByText("Perfect Score")).toBeVisible({
      timeout: 3000,
    });
  });

  test("responsive layout works on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to stats page
    await page.goto("/stats");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Take screenshot for verification
    await page.screenshot({ path: "/tmp/stats-mobile.png" });

    // Page should still be usable
    await expect(page.getByRole("heading", { name: /my stats/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
