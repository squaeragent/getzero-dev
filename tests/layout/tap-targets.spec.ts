import { test, expect } from "@playwright/test";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];
const MIN_TAP_SIZE = 44; // Apple HIG / WCAG 2.5.8

for (const path of PAGES) {
  test(`tap targets >= ${MIN_TAP_SIZE}px – ${path}`, async ({ page, isMobile }) => {
    test.skip(!isMobile, "Tap target audit only applies to mobile viewports");

    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const violations = await page.evaluate((minSize) => {
      const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]');
      const issues: { tag: string; text: string; width: number; height: number }[] = [];

      for (const el of interactive) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        // Skip hidden elements
        if (
          rect.width === 0 ||
          rect.height === 0 ||
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0"
        ) {
          continue;
        }

        if (rect.width < minSize || rect.height < minSize) {
          issues.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent ?? "").trim().slice(0, 40),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
      return issues;
    }, MIN_TAP_SIZE);

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  <${v.tag}> "${v.text}" → ${v.width}×${v.height}px`)
        .join("\n");
      expect.soft(violations.length, `Undersized tap targets on ${path}:\n${report}`).toBe(0);
    }
  });
}
