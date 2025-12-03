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
    const response = await request.get("http://localhost:8787/");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("status", "healthy");
  });
});
