import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
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
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Start local servers before running tests
  webServer: [
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
