// Sprint 1 E2E tests (docs/sprints/sprint-1/E2E.md): the real server on :3100
// serving the built React app, against the local test database.
import { defineConfig, devices } from "@playwright/test";

// Same database as the server's API tests. Override with E2E_DATABASE_URL;
// global-setup refuses anything that is not a local *_test database.
export const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://approvalflow:approvalflow@localhost:5433/approvalflow_test?schema=public";

// Throwaway password for the demo users the E2E run seeds into the test database.
export const DEMO_USER_PASSWORD = "e2e-demo-password";

const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  // The journeys share one database and server; run them one at a time.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Build the client first: the server serves client/dist only if it exists at start.
    command: "npm --prefix ../client run build && npx tsx src/index.ts",
    cwd: "../server",
    url: `http://localhost:${PORT}/api/ready`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL, PORT: String(PORT), NODE_ENV: "test" },
  },
});
