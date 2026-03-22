import { test, expect } from "@playwright/test";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];

for (const path of PAGES) {
  test(`single visible nav – ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const visibleNavCount = await page.evaluate(() => {
      const navs = document.querySelectorAll("nav");
      let count = 0;
      for (const nav of navs) {
        const rect = nav.getBoundingClientRect();
        const style = window.getComputedStyle(nav);
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0";
        if (isVisible) count++;
      }
      return count;
    });

    expect(visibleNavCount, `Found ${visibleNavCount} visible nav elements on ${path}`).toBeLessThanOrEqual(1);
  });
}
