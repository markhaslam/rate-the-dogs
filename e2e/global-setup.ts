import type { FullConfig } from "@playwright/test";

/**
 * Global setup function that runs once before all tests.
 * Verifies the server is healthy and ready to accept requests.
 * This prevents tests from failing due to server startup timing issues.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:8787";
  const maxRetries = 30;
  const retryDelay = 1000; // 1 second

  console.warn(`\n[Global Setup] Waiting for server at ${baseURL}...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try to fetch the home page - this validates both API and static assets are working
      const response = await fetch(baseURL, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.warn(
          `[Global Setup] Server ready after ${attempt} attempt(s)\n`
        );
        return;
      }

      console.warn(
        `[Global Setup] Attempt ${attempt}/${maxRetries}: Server returned ${response.status}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (attempt < maxRetries) {
        console.warn(
          `[Global Setup] Attempt ${attempt}/${maxRetries}: ${message}`
        );
      }
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(
    `[Global Setup] Server at ${baseURL} not ready after ${maxRetries} attempts (${maxRetries}s). ` +
      `Make sure the server is running or check the webServer configuration in playwright.config.ts.`
  );
}

export default globalSetup;
