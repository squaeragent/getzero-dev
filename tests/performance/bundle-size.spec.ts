import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const MAX_JS_GZIPPED_KB = 200;

async function collectFiles(dir: string, ext: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectFiles(fullPath, ext)));
      } else if (entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return files;
}

test("total JS bundle < 200KB gzipped", async () => {
  const distDir = join(process.cwd(), "dist");

  // Verify dist exists (build should have run before tests)
  try {
    await stat(distDir);
  } catch {
    test.skip(true, "dist/ not found – run `npm run build` first");
    return;
  }

  const jsFiles = await collectFiles(distDir, ".js");
  let totalGzipped = 0;

  const fileSizes: { file: string; raw: number; gzipped: number }[] = [];

  for (const file of jsFiles) {
    const content = readFileSync(file);
    const gzipped = gzipSync(content);
    totalGzipped += gzipped.length;
    fileSizes.push({
      file: file.replace(distDir, ""),
      raw: content.length,
      gzipped: gzipped.length,
    });
  }

  const totalKB = Math.round(totalGzipped / 1024);

  if (totalKB > MAX_JS_GZIPPED_KB) {
    // Sort by gzipped size descending for the report
    fileSizes.sort((a, b) => b.gzipped - a.gzipped);
    const top5 = fileSizes
      .slice(0, 5)
      .map((f) => `  ${f.file}: ${Math.round(f.gzipped / 1024)}KB gzipped`)
      .join("\n");

    expect(
      totalKB,
      `Total JS: ${totalKB}KB gzipped (limit: ${MAX_JS_GZIPPED_KB}KB)\nLargest files:\n${top5}`
    ).toBeLessThanOrEqual(MAX_JS_GZIPPED_KB);
  }
});
