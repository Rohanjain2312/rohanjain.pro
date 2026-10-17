// Captures each page at 390, 768 and 1280 px into tests/visual/screenshots/ with every fold open, for
// the Design Lead's review against reference/mockup/. These are captures, not pixel baselines: font
// rendering differs by machine, so baselines are approved by the Design Lead, not diffed here.
import { test } from '@playwright/test';

const PAGES = [
  { name: 'index', path: '/' },
  { name: 'privacy', path: '/privacy/' },
  { name: '404', path: '/404.html' },
];

for (const p of PAGES) {
  for (const width of [390, 768, 1280]) {
    test(`capture ${p.name} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(p.path);
      await page.evaluate(async () => {
        for (const d of document.querySelectorAll('details')) d.open = true;
        for (const img of document.querySelectorAll('img')) img.loading = 'eager';
        await document.fonts.ready;
        await Promise.all(
          Array.from(document.images).map((i) =>
            i.complete ? null : i.decode().catch(() => null),
          ),
        );
      });
      await page.screenshot({
        path: `tests/visual/screenshots/${p.name}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
