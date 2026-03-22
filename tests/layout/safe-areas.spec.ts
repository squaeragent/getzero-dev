import { test, expect } from "@playwright/test";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];

for (const path of PAGES) {
  test(`safe area handling – ${path}`, async ({ page, isMobile }) => {
    test.skip(!isMobile, "Safe area audit only applies to mobile viewports");

    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Check that the site uses viewport-fit=cover (required for safe area insets to work)
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute("content") ?? "";
    });

    // Check CSS for safe-area-inset usage
    const usesSafeArea = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      let found = false;
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            if (rule.cssText.includes("safe-area-inset") || rule.cssText.includes("env(")) {
              found = true;
              break;
            }
          }
        } catch {
          // Cross-origin stylesheet, skip
        }
        if (found) break;
      }
      return found;
    });

    // Check that no content is positioned at the very top edge (0px) without padding
    const topBleed = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      const firstChild = body.firstElementChild;
      if (!firstChild) return false;
      const rect = firstChild.getBoundingClientRect();
      const bodyPadding = parseFloat(style.paddingTop);
      // Content starts at absolute 0 with no padding – potential notch bleed
      return rect.top === 0 && bodyPadding === 0;
    });

    // Soft assertions – warn but don't hard-fail if no safe area support
    if (viewportMeta.includes("viewport-fit=cover")) {
      expect.soft(usesSafeArea, `${path} uses viewport-fit=cover but no env(safe-area-inset-*) in CSS`).toBe(true);
    }

    expect.soft(topBleed, `${path} content may bleed behind status bar / notch`).toBe(false);
  });
}
