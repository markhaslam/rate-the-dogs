import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RateTheDogs/);
  });

  test("navigation works", async ({ page }) => {
    await page.goto("/");
    // Add navigation tests once pages are implemented
  });

  test("API health check responds", async ({ request }) => {
    // Use environment-aware base URL for API
    const apiBase = process.env.CI
      ? "http://localhost:8787"
      : "http://localhost:8787";
    const response = await request.get(`${apiBase}/`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
  });
});
