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

for (const page of PAGES) {
  test(`visual snapshot – ${page.name}`, async ({ page: p }) => {
    await p.goto(page.path, { waitUntil: "networkidle" });
    await p.waitForTimeout(1_000);

    await expect(p).toHaveScreenshot(`${page.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
