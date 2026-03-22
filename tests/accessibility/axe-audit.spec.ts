import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

for (const pg of PAGES) {
  test(`axe accessibility audit – ${pg.name}`, async ({ page }) => {
    await page.goto(pg.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
      help: v.helpUrl,
    }));

    if (violations.length > 0) {
      const report = violations
        .map((v) => `  [${v.impact}] ${v.id}: ${v.description} (${v.nodes} nodes)\n    ${v.help}`)
        .join("\n");
      expect.soft(violations.length, `Axe violations on ${pg.name}:\n${report}`).toBe(0);
    }
  });
}
