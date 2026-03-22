import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:4321";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],
  use: {
    baseURL,
    colorScheme: "dark",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // ── Mobile ──────────────────────────────────────────────
    {
      name: "iphone-se",
      use: {
        ...devices["iPhone SE"],
        colorScheme: "dark",
      },
    },
    {
      name: "iphone-14",
      use: {
        ...devices["iPhone 14"],
        colorScheme: "dark",
      },
    },
    {
      name: "iphone-15-pro-max",
      use: {
        ...devices["iPhone 15 Pro Max"],
        colorScheme: "dark",
      },
    },
    {
      name: "galaxy-s24",
      use: {
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        colorScheme: "dark",
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "pixel-8",
      use: {
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
        colorScheme: "dark",
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      },
    },
    // ── Tablet ──────────────────────────────────────────────
    {
      name: "ipad-mini",
      use: {
        ...devices["iPad Mini"],
        colorScheme: "dark",
      },
    },
    // ── Desktop ─────────────────────────────────────────────
    {
      name: "desktop-1440",
      use: {
        viewport: { width: 1440, height: 900 },
        colorScheme: "dark",
      },
    },
    {
      name: "desktop-1920",
      use: {
        viewport: { width: 1920, height: 1080 },
        colorScheme: "dark",
      },
    },
  ],
  webServer: {
    command: "npx serve dist/client -l 4321 --no-clipboard",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
