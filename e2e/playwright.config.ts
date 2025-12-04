import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests
 *
 * Supports three modes:
 * 1. Local dev (default): Fast iteration with hot reload, parallel execution
 * 2. CI simulation (CI_SIM=true): Mimics CI environment locally to catch issues before push
 * 3. CI (CI=true): Full CI environment with all browsers including webkit
 *
 * Usage:
 *   bun run test:e2e          # Local dev mode (fast, parallel)
 *   bun run test:e2e:ci       # CI simulation (serial, retries, built assets)
 *   CI=true bun run test:e2e  # Full CI mode (includes webkit - requires system deps)
 *
 * Reliability features:
 *   - Global setup verifies server health before tests run
 *   - Locked browser channels for consistent behavior across environments
 *   - WebKit-based browsers skipped for cookie-dependent tests (wrangler dev limitation)
 */

// CI simulation mode: run like CI but without webkit (not available on WSL)
const isCI = !!process.env.CI;
const isCISim = !!process.env.CI_SIM;
const useCISettings = isCI || isCISim;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,

  // Global setup verifies server is healthy before running any tests
  globalSetup: require.resolve("./global-setup"),

  // Retries: 2 in CI/CI-sim to handle transient failures, 0 locally for fast feedback
  retries: useCISettings ? 2 : 0,

  // Workers: 1 in CI/CI-sim for stability, unlimited locally for speed
  workers: useCISettings ? 1 : undefined,

  reporter: "html",

  use: {
    // CI/CI-sim use wrangler (8787), local dev uses vite (3000)
    baseURL: useCISettings ? "http://localhost:8787" : "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use stable Chrome channel for consistent behavior across CI and local
        channel: "chrome",
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // Webkit requires system libraries not available on WSL
    // Only run webkit in actual CI (not CI simulation) where dependencies are installed
    ...(isCI
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
    // Mobile Safari also uses webkit engine - only in actual CI
    ...(isCI
      ? [
          {
            name: "Mobile Safari",
            use: { ...devices["iPhone 12"] },
          },
        ]
      : []),
  ],

  // Server configuration
  webServer: useCISettings
    ? [
        // CI/CI-sim: Use unified wrangler server with built assets
        // This matches production behavior more closely
        {
          command:
            "bun run --cwd ../apps/web build && bun run --cwd ../apps/api db:migrate:local && bun run ../apps/api/scripts/seedTestData.ts --local && bun run --cwd ../apps/api dev",
          port: 8787,
          reuseExistingServer: false,
          timeout: 120000, // Allow time for build + migrate + seed
        },
      ]
    : [
        // Local dev: Use separate servers for hot reload
        {
          command: "bun run --cwd ../apps/api dev",
          port: 8787,
          reuseExistingServer: true,
        },
        {
          command: "bun run --cwd ../apps/web dev",
          port: 3000,
          reuseExistingServer: true,
        },
      ],
});
