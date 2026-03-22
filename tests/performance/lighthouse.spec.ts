import { test, expect } from "@playwright/test";

const PAGES = [
  { name: "home", path: "/" },
  { name: "journal", path: "/journal" },
  { name: "system", path: "/system" },
  { name: "manifesto", path: "/manifesto" },
  { name: "terminal", path: "/terminal" },
  { name: "token", path: "/token" },
  { name: "access", path: "/access" },
  { name: "intel", path: "/intel" },
];

const MAX_LOAD_TIME_MS = 3_000;

for (const pg of PAGES) {
  test(`no "Loading..." placeholder in server HTML – ${pg.name}`, async ({ request }) => {
    const response = await request.get(pg.path);
    const html = await response.text();

    expect(response.status()).toBe(200);

    // Check for common loading placeholder patterns in raw HTML
    const loadingPatterns = [
      />\s*Loading\.\.\.\s*</i,
      />\s*Loading\s*</i,
      /class="[^"]*loading[^"]*"[^>]*>\s*</i,
      /aria-busy="true"/i,
    ];

    for (const pattern of loadingPatterns) {
      expect(
        pattern.test(html),
        `Found "${pattern}" in server-rendered HTML of ${pg.name}`
      ).toBe(false);
    }
  });

  test(`page load < ${MAX_LOAD_TIME_MS / 1000}s – ${pg.name}`, async ({ page }) => {
    const start = Date.now();
    await page.goto(pg.path, { waitUntil: "networkidle" });
    const loadTime = Date.now() - start;

    expect(
      loadTime,
      `${pg.name} took ${loadTime}ms to load (limit: ${MAX_LOAD_TIME_MS}ms)`
    ).toBeLessThan(MAX_LOAD_TIME_MS);
  });
}
