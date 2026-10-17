// Zero axe violations on every page (acceptance criteria of #181; docs/spec/09-quality.md 9.1).
// Each page is scanned twice: with folds closed, as a visitor first sees it, and with every fold open.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'privacy', path: '/privacy/' },
  { name: '404', path: '/404.html' },
];

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function scan(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => n.target.join(' ')),
  }));
}

for (const p of PAGES) {
  for (const width of [390, 1280]) {
    test(`${p.name} at ${width}px: no axe violations, folds closed`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(p.path);
      expect(await scan(page)).toEqual([]);
    });

    test(`${p.name} at ${width}px: no axe violations, folds open`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(p.path);
      await page.evaluate(() => {
        for (const d of document.querySelectorAll('details')) d.open = true;
      });
      expect(await scan(page)).toEqual([]);
    });
  }
}
