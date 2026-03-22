import { test, expect } from "@playwright/test";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];
const MIN_FONT_SIZE = 12;

for (const path of PAGES) {
  test(`no text smaller than ${MIN_FONT_SIZE}px – ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const violations = await page.evaluate((minSize) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });

      const issues: { text: string; fontSize: string; tag: string }[] = [];
      const seen = new Set<Element>();

      while (walker.nextNode()) {
        const el = walker.currentNode.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);

        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const fontSize = parseFloat(style.fontSize);
        if (fontSize < minSize) {
          issues.push({
            text: (el.textContent ?? "").trim().slice(0, 40),
            fontSize: style.fontSize,
            tag: el.tagName.toLowerCase(),
          });
        }
      }
      return issues;
    }, MIN_FONT_SIZE);

    if (violations.length > 0) {
      const report = violations.map((v) => `  <${v.tag}> "${v.text}" → ${v.fontSize}`).join("\n");
      expect.soft(violations.length, `Text below ${MIN_FONT_SIZE}px on ${path}:\n${report}`).toBe(0);
    }
  });
}
