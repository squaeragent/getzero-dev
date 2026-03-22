import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];

for (const path of PAGES) {
  test(`WCAG AA color contrast – ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .include("body")
      .withRules(["color-contrast", "color-contrast-enhanced"])
      .analyze();

    const violations = results.violations.flatMap((v) =>
      v.nodes.map((n) => ({
        rule: v.id,
        impact: v.impact,
        target: n.target.join(" > "),
        message: n.failureSummary ?? "",
      }))
    );

    if (violations.length > 0) {
      const report = violations
        .slice(0, 20) // Cap report length
        .map((v) => `  [${v.impact}] ${v.target}\n    ${v.message}`)
        .join("\n");
      const suffix = violations.length > 20 ? `\n  ... and ${violations.length - 20} more` : "";
      expect.soft(violations.length, `Contrast violations on ${path}:\n${report}${suffix}`).toBe(0);
    }
  });
}
