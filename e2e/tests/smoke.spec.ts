import { test, expect } from "@playwright/test";

/**
 * Smoke tests for critical application paths.
 *
 * These tests are designed to be fast and catch fundamental issues:
 * - Application loads and renders
 * - API is healthy
 * - Core functionality (rating) works
 * - Navigation between pages works
 *
 * Run these first to quickly validate the app is functional before
 * running the full test suite.
 *
 * Usage: bun run test:e2e -- --grep="Smoke"
 */
test.describe("Smoke Tests", () => {
  test("API health check responds", async ({ request }) => {
    // Use environment-aware base URL for API
    const apiBase = process.env.CI
      ? "http://localhost:8787"
      : "http://localhost:8787";
    const response = await request.get(`${apiBase}/api/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
  });

  test("application loads and displays home page", async ({ page }) => {
    await page.goto("/");

    // Verify the page title
    await expect(page).toHaveTitle(/Rate.*Dogs/i);

    // Verify the rating interface is present (core functionality)
    await expect(
      page.locator('[role="group"][aria-label="Rating"]')
    ).toBeVisible({
      timeout: 15000, // Allow time for initial load and dog image fetch
    });

    // Verify navigation is present
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("can rate a dog", async ({ page }) => {
    await page.goto("/");

    // Wait for rating buttons to load
    await page.waitForSelector('[role="group"][aria-label="Rating"]', {
      timeout: 15000,
    });

    // Click on a bone to rate (rating of 3)
    const bones = page.locator('[role="group"][aria-label="Rating"] button');
    await bones.nth(2).click();

    // Verify reveal appears (proves rating was processed)
    const reveal = page.locator('[data-testid="rating-reveal"]');
    await expect(reveal).toBeVisible({ timeout: 5000 });

    // Verify rating count appears (proves server response received)
    await expect(page.getByText(/\d+ rated/)).toBeVisible({ timeout: 5000 });
  });

  test("leaderboard page loads", async ({ page }) => {
    await page.goto("/leaderboard");

    // Verify leaderboard heading is present
    await expect(
      page.getByRole("heading", { name: /leaderboard/i })
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("stats page loads", async ({ page }) => {
    await page.goto("/stats");

    // Stats page should show either stats content or empty state
    // Both are valid - just verify the page loads
    const hasStats = page.getByRole("heading", { name: /my stats/i });
    const hasEmptyState = page.getByText(/No Stats Yet/i);

    await expect(hasStats.or(hasEmptyState)).toBeVisible({
      timeout: 10000,
    });
  });

  test("navigation works between pages", async ({ page, isMobile }) => {
    // Start at home
    await page.goto("/");
    await expect(page).toHaveURL("/");

    // On mobile, open hamburger menu first
    if (isMobile) {
      const menuButton = page.locator('button[aria-label="Toggle menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        // Wait for menu to open
        await expect(
          page.getByRole("link", { name: /leaderboard/i })
        ).toBeVisible();
      }
    }

    // Navigate to leaderboard
    await page.getByRole("link", { name: /leaderboard/i }).click();
    await expect(page).toHaveURL(/\/leaderboard/);

    // On mobile, open hamburger menu again for return navigation
    if (isMobile) {
      const menuButton = page.locator('button[aria-label="Toggle menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await expect(page.getByRole("link", { name: /rate/i })).toBeVisible();
      }
    }

    // Navigate back to home
    await page.getByRole("link", { name: /rate/i }).first().click();
    await expect(page).toHaveURL("/");
  });
});
