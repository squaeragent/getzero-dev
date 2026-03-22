import { test, expect } from "@playwright/test";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];

for (const path of PAGES) {
  test(`no horizontal overflow – ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(overflow, `Horizontal overflow detected on ${path}`).toBe(false);
  });
}
