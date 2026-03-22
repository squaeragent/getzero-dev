import { test, expect } from "@playwright/test";

const PAGES = ["/", "/journal", "/system", "/manifesto", "/terminal", "/token", "/access", "/intel"];

for (const path of PAGES) {
  test(`interactive elements have accessible names – ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const violations = await page.evaluate(() => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"]'
      );
      const issues: { tag: string; outerHTML: string }[] = [];

      for (const el of interactive) {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;

        const hasName =
          el.getAttribute("aria-label") ||
          el.getAttribute("aria-labelledby") ||
          el.getAttribute("title") ||
          (el.textContent?.trim()?.length ?? 0) > 0 ||
          (el as HTMLInputElement).placeholder ||
          el.querySelector("img[alt]") ||
          el.querySelector("svg[aria-label]");

        if (!hasName) {
          issues.push({
            tag: el.tagName.toLowerCase(),
            outerHTML: el.outerHTML.slice(0, 120),
          });
        }
      }
      return issues;
    });

    if (violations.length > 0) {
      const report = violations.map((v) => `  <${v.tag}> ${v.outerHTML}`).join("\n");
      expect.soft(violations.length, `Elements without accessible names on ${path}:\n${report}`).toBe(0);
    }
  });

  test(`images have alt text – ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const violations = await page.evaluate(() => {
      const images = document.querySelectorAll("img");
      const issues: { src: string }[] = [];

      for (const img of images) {
        const style = window.getComputedStyle(img);
        if (style.display === "none" || style.visibility === "hidden") continue;

        const alt = img.getAttribute("alt");
        const role = img.getAttribute("role");

        // alt="" with role="presentation" is valid (decorative image)
        if (role === "presentation" || role === "none") continue;

        // Missing alt attribute entirely
        if (alt === null) {
          issues.push({ src: img.src.slice(0, 100) });
        }
      }
      return issues;
    });

    if (violations.length > 0) {
      const report = violations.map((v) => `  <img src="${v.src}">`).join("\n");
      expect.soft(violations.length, `Images without alt text on ${path}:\n${report}`).toBe(0);
    }
  });
}
