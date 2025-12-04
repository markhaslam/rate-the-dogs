import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    globals: false,
    passWithNoTests: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          // Mock bindings for tests
          d1Databases: ["DB"],
          r2Buckets: ["IMAGES"],
          bindings: {
            ADMIN_SECRET: "test-admin-secret",
            ENVIRONMENT: "test",
          },
        },
      },
    },
    include: ["src/**/*.test.ts"],
    coverage: {
      // V8 coverage not supported in Cloudflare Workers pool - use Istanbul
      // See: https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/test/**"],
    },
  },
});
