import { test, expect } from "@playwright/test";

test.describe("Rating Flow", () => {
  test("should be able to rate a dog and see reveal animation", async ({
    page,
  }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Collect network errors
    const networkErrors: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) {
        networkErrors.push(
          `${response.status()} ${response.url()} - ${response.statusText()}`
        );
      }
    });

    // Navigate to rate page
    await page.goto("/");

    // Wait for rating buttons to load (means dog card is ready)
    await page.waitForSelector('[role="group"][aria-label="Rating"]', {
      timeout: 10000,
    });

    // Take a screenshot before rating
    await page.screenshot({ path: "/tmp/before-rating.png" });

    // Find and click on a bone to rate
    const bones = page.locator('[role="group"][aria-label="Rating"] button');
    const boneCount = await bones.count();
    expect(boneCount).toBe(5); // Should have 5 rating bones

    // Click on the 4th bone (rating 4)
    await bones.nth(3).click();

    // Wait for the rating reveal to appear
    const reveal = page.locator('[data-testid="rating-reveal"]');
    await expect(reveal).toBeVisible({ timeout: 5000 });

    // Take screenshot of reveal animation
    await page.screenshot({ path: "/tmp/rating-reveal.png" });

    // Verify reveal shows expected content
    await expect(page.getByText("Average Rating")).toBeVisible();
    await expect(page.getByText(/Based on \d+ rating/)).toBeVisible();

    // Click to dismiss and move to next dog
    await reveal.click();

    // Wait for next dog to load (reveal should disappear)
    await expect(reveal).not.toBeVisible({ timeout: 3000 });

    // Take screenshot after reveal
    await page.screenshot({ path: "/tmp/after-reveal.png" });

    // Report errors (use console.warn as allowed by linter)
    if (consoleErrors.length > 0) {
      console.warn("Console errors:", consoleErrors);
    }
    if (networkErrors.length > 0) {
      console.warn("Network errors:", networkErrors);
    }

    // Assert no critical errors
    expect(networkErrors.length).toBe(0);
    expect(consoleErrors.filter((e) => e.includes("400"))).toHaveLength(0);
  });

  test("should show rating count badge after rating", async ({ page }) => {
    // Navigate to rate page
    await page.goto("/");

    // Wait for dog card to load
    await page.waitForSelector('[role="group"][aria-label="Rating"]', {
      timeout: 10000,
    });

    // Click on a bone to rate
    const bones = page.locator('[role="group"][aria-label="Rating"] button');
    await bones.nth(2).click(); // Rate 3

    // Wait for reveal animation
    const reveal = page.locator('[data-testid="rating-reveal"]');
    await expect(reveal).toBeVisible({ timeout: 5000 });

    // Verify "rated" badge appears
    await expect(page.getByText(/\d+ rated/)).toBeVisible();

    // Click to dismiss
    await reveal.click();
    await expect(reveal).not.toBeVisible({ timeout: 3000 });
  });

  test("should be able to skip a dog", async ({ page }) => {
    // Navigate to rate page
    await page.goto("/");

    // Wait for dog card to load
    await page.waitForSelector('[role="group"][aria-label="Rating"]', {
      timeout: 10000,
    });

    // Click skip button
    await page.getByRole("button", { name: /skip this dog/i }).click();

    // Wait for next dog to load
    await page.waitForTimeout(500);

    // Verify rating group is still visible (a new dog loaded)
    await expect(
      page.locator('[role="group"][aria-label="Rating"]')
    ).toBeVisible();
  });
});
