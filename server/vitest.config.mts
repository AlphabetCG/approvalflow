import { defineConfig } from "vitest/config";

// Two projects so tests that need no database run without one:
//   npm run test:unit         -> tests/**/*.test.ts except *.int.test.ts
//   npm run test:integration  -> tests/**/*.int.test.ts (needs the test database)
//   npm test                  -> both
export default defineConfig({
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/**/*.int.test.ts"],
          // Reset the test database once, then load .env.test in every worker.
          globalSetup: ["./tests/setup/global-setup.ts"],
          setupFiles: ["./tests/setup/env.ts"],
          // Integration tests share one database, so run test files one at a time.
          fileParallelism: false,
        },
      },
    ],
  },
});
