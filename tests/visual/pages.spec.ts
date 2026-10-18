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

// Fit check: each result state, and the brief on screen and as printed. Samples give the three
// postings; the fourth state is an empty run. The section is captured, not the whole page.
const FIT_STATES = [
  { name: 'ai', sample: 'AI Engineer' },
  { name: 'ds', sample: 'Data Scientist' },
  { name: 'ios', sample: 'iOS Engineer' },
  { name: 'none', sample: null },
] as const;

for (const width of [390, 768, 1280]) {
  for (const state of FIT_STATES) {
    test(`capture fit check, ${state.name} result, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      if (state.sample) {
        await page.getByRole('button', { name: state.sample, exact: true }).click();
      } else {
        await page.locator('[data-fit-run]').click();
      }
      await page.locator('#fit-optional > summary').click();
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#fit').screenshot({
        path: `tests/visual/screenshots/fit-${state.name}-${width}.png`,
      });
    });
  }

  test(`capture the brief dialog at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.getByRole('button', { name: 'AI Engineer', exact: true }).click();
    await page.locator('[data-fit-brief-open]').click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `tests/visual/screenshots/brief-${width}.png` });
  });
}

test('capture the brief as printed (680 px, Letter content width)', async ({ page }) => {
  await page.setViewportSize({ width: 680, height: 919 });
  await page.goto('/');
  await page.getByRole('button', { name: 'AI Engineer', exact: true }).click();
  await page.locator('[data-fit-brief-open]').click();
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'tests/visual/screenshots/brief-print.png' });
});
