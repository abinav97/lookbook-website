import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests against the running site. Uses an already-running dev server
 * on :3000 when present (npm run dev), otherwise starts one.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 2,
  reporter: "list",
  outputDir: ".playwright/results",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    screenshot: "off",
    // Use a browser already on the machine; Playwright's own download is not
    // required for these smoke tests.
    channel: "chrome",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
