// Captures each page at 390, 768 and 1280 px into tests/visual/screenshots/ with every fold open, for
// the Design Lead's review against reference/mockup/. These are captures, not pixel baselines: font
// rendering differs by machine, so baselines are approved by the Design Lead, not diffed here.
import { existsSync } from 'node:fs';
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

// Demo dialog states and the footer. hf.space gets a stub page, so no test touches the network.
for (const width of [390, 768, 1280]) {
  for (const state of ['static', 'loaded'] as const) {
    test(`capture demo dialog, ${state}, at ${width}px`, async ({ page }) => {
      await page.route('https://*.hf.space/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<p>live demo placeholder</p>' }),
      );
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.getByRole('link', { name: /try it here for FinCompress/ }).click();
      if (state === 'loaded') {
        await page.getByRole('button', { name: 'Load live demo' }).click();
        await page.locator('iframe').waitFor();
      }
      await page.screenshot({ path: `tests/visual/screenshots/demo-${state}-${width}.png` });
    });
  }

  test(`capture footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const name = existsSync('public/status.json') ? 'footer-status' : 'footer';
    await page
      .locator('.site-footer')
      .screenshot({ path: `tests/visual/screenshots/${name}-${width}.png` });
  });
}

// Keyboard focus on the demo dialog: the sheet button (ink ring on white) and a toolbar control (paper ring on ink).
test('capture demo dialog focus rings at 1280px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.getByRole('link', { name: /try it here for FinCompress/ }).click();
  const dialog = page.locator('dialog.demo');
  await page.getByRole('button', { name: 'Load live demo' }).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await dialog.screenshot({ path: 'tests/visual/screenshots/demo-focus-button-1280.png' });
  await dialog.locator('.demo__toolbar button, .demo__toolbar a').first().focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await dialog.screenshot({ path: 'tests/visual/screenshots/demo-focus-toolbar-1280.png' });
});
