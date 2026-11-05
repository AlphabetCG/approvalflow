import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Recreate the test database once, then load .env.test in every worker.
    globalSetup: ["./tests/setup/global-setup.ts"],
    setupFiles: ["./tests/setup/env.ts"],
    // Integration tests share one database, so run test files one at a time.
    fileParallelism: false,
  },
});
