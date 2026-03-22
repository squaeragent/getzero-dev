import { test, expect, type Locator } from "@playwright/test";

const COMPONENT_SELECTORS: Record<string, string> = {
  nav: "nav",
  footer: "footer",
  "status-bar": "[data-component='status-bar'], .status-bar, [role='status']",
  "hero-section": "[data-component='hero'], .hero, section:first-of-type",
};

// Use the home page as the source for component screenshots
const SOURCE_PAGE = "/";

for (const [name, selector] of Object.entries(COMPONENT_SELECTORS)) {
  test(`component snapshot – ${name}`, async ({ page }) => {
    await page.goto(SOURCE_PAGE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1_000);

    const element = page.locator(selector).first();
    const isVisible = await element.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await expect(element).toHaveScreenshot(`component-${name}.png`, {
      maxDiffPixelRatio: 0.01,
    });
  });
}
