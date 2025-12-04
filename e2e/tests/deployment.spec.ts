import { test, expect } from "@playwright/test";

/**
 * Deployment verification tests
 *
 * These tests verify that the unified Cloudflare Workers deployment
 * is working correctly with static assets and API routes.
 */
test.describe("Deployment verification", () => {
  test.describe("Static assets", () => {
    test("homepage loads with correct content", async ({ page }) => {
      await page.goto("/");

      // Verify page loads
      await expect(page).toHaveTitle(/RateTheDogs/);

      // Verify the app has rendered (look for navigation or main content)
      // The logo text may be hidden on mobile, so check for nav links instead
      await expect(
        page.getByRole("navigation").or(page.locator("main")).first()
      ).toBeVisible();
    });

    test("CSS and JS bundles load correctly", async ({ page }) => {
      const failedRequests: string[] = [];

      // Listen for failed requests
      page.on("requestfailed", (request) => {
        const url = request.url();
        if (url.includes(".js") || url.includes(".css")) {
          failedRequests.push(url);
        }
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // No CSS or JS should fail to load
      expect(failedRequests).toHaveLength(0);
    });

    test("images load without 404s", async ({ page }) => {
      const failedImages: string[] = [];

      page.on("requestfailed", (request) => {
        const url = request.url();
        // Only check local static assets, not external images (like Dog CEO API)
        // Local assets are served from the same origin or relative paths
        const isExternalImage =
          url.includes("dog.ceo") || url.includes("images.dog.ceo");
        const isImage =
          url.includes(".svg") ||
          url.includes(".png") ||
          url.includes(".jpg") ||
          url.includes(".webp");

        if (isImage && !isExternalImage) {
          failedImages.push(url);
        }
      });

      await page.goto("/");
      // Wait for DOM to load - don't wait for external images (networkidle)
      // which can timeout if Dog CEO API is slow
      await page.waitForLoadState("domcontentloaded");
      // Small buffer for local asset requests to initiate
      await page.waitForTimeout(1000);

      // Local static images should load
      expect(failedImages).toHaveLength(0);
    });
  });

  test.describe("SPA routing", () => {
    test("direct navigation to /leaderboard works", async ({ page }) => {
      // Navigate directly to a SPA route
      await page.goto("/leaderboard");

      // Should not get a 404, should render the app
      await expect(page).toHaveTitle(/RateTheDogs/);
    });

    test("direct navigation to /upload works", async ({ page }) => {
      await page.goto("/upload");
      await expect(page).toHaveTitle(/RateTheDogs/);
    });

    test("client-side navigation works", async ({ page }) => {
      await page.goto("/");

      // Find and click a navigation link (use exact match to avoid multiple elements)
      const leaderboardLink = page.getByRole("link", {
        name: "Leaderboard",
        exact: true,
      });
      if (await leaderboardLink.isVisible()) {
        await leaderboardLink.click();
        await expect(page).toHaveURL(/\/leaderboard/);
      }
    });
  });

  test.describe("API routes (same origin)", () => {
    test("GET /api/dogs/next returns dog data", async ({ request }) => {
      const apiBase = process.env.CI
        ? "http://localhost:8787"
        : "http://localhost:8787";

      const response = await request.get(`${apiBase}/api/dogs/next`);

      // Should return 200 or appropriate status
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        expect(body).toHaveProperty("success");
      }
    });

    test("GET /api/breeds returns breeds list", async ({ request }) => {
      const apiBase = process.env.CI
        ? "http://localhost:8787"
        : "http://localhost:8787";

      const response = await request.get(`${apiBase}/api/breeds`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty("success", true);
      expect(body).toHaveProperty("data");
    });

    test("GET /api/leaderboard/dogs returns leaderboard", async ({
      request,
    }) => {
      const apiBase = process.env.CI
        ? "http://localhost:8787"
        : "http://localhost:8787";

      const response = await request.get(`${apiBase}/api/leaderboard/dogs`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty("success", true);
    });

    test("API returns proper error for invalid route", async ({ request }) => {
      const apiBase = process.env.CI
        ? "http://localhost:8787"
        : "http://localhost:8787";

      const response = await request.get(`${apiBase}/api/nonexistent`);

      expect(response.status()).toBe(404);
      const body = await response.json();
      expect(body).toHaveProperty("success", false);
    });
  });

  test.describe("Cookie handling (same origin)", () => {
    test("anonymous ID cookie is set on first request", async ({ page }) => {
      await page.goto("/");

      // Make an API request that would trigger cookie
      const response = await page.request.get("/api/dogs/next");

      // Check cookies are being set
      const cookies = await page.context().cookies();
      const anonCookie = cookies.find((c) => c.name === "anon_id");

      // Cookie should be set after API interaction
      if (response.ok()) {
        expect(anonCookie).toBeDefined();
      }
    });
  });
});
