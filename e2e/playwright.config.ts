import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 *
 * Supports two modes:
 * - CI: Uses unified wrangler server (requires pre-built web app)
 * - Local dev: Uses separate servers for hot reload
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.CI ? "http://localhost:8787" : "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // Webkit requires system libraries not available on WSL
    // Only run webkit in CI where dependencies are installed
    ...(process.env.CI
      ? [
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
        ]
      : []),
    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    // Mobile Safari also uses webkit engine
    ...(process.env.CI
      ? [
          {
            name: "Mobile Safari",
            use: { ...devices["iPhone 12"] },
          },
        ]
      : []),
  ],

  // Start local servers before running tests
  webServer: process.env.CI
    ? [
        // CI: Use unified wrangler server (requires pre-built web app + D1 migrations)
        {
          command:
            "bun run --cwd ../apps/web build && bun run --cwd ../apps/api db:migrate:local && bun run --cwd ../apps/api dev",
          port: 8787,
          reuseExistingServer: false,
        },
      ]
    : [
        // Local dev: Use separate servers for hot reload
        {
          command: "bun run --cwd ../apps/api dev",
          port: 8787,
          reuseExistingServer: !process.env.CI,
        },
        {
          command: "bun run --cwd ../apps/web dev",
          port: 3000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});
