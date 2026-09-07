import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./output/playwright/results",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  reporter: [["list"], ["html", { outputFolder: "output/playwright/report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    { name: "webkit-iphone", use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 } } },
    { name: "chromium-pixel", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [{
        command: "npm run dev -- --hostname 127.0.0.1 --port 4173",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }, {
        command: "npm run preview:e2e",
        url: "http://127.0.0.1:4174/",
        reuseExistingServer: false,
        timeout: 120_000,
      }],
});
