// Zero axe violations in the fit-check states (acceptance criteria of #194): section open, each result
// shown, and the brief dialog open. Same tags as pages.spec.ts.
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const samples = JSON.parse(readFileSync('tests/fixtures/golden/samples.json', 'utf8')) as {
  label: string;
}[];

async function scan(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => n.target.join(' ')),
  }));
}

for (const width of [390, 1280]) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('[data-fit-controls]')).toBeVisible();
    });

    test('the section open, nothing run', async ({ page }) => {
      await page.locator('#fit-optional > summary').click();
      expect(await scan(page)).toEqual([]);
    });

    test('the section with 7,000 characters pasted (counter shown)', async ({ page }) => {
      await page.locator('#fit-text').fill('a'.repeat(7100));
      await expect(page.locator('[data-fit-count]')).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    for (const s of samples) {
      test(`a result shown: ${s.label}`, async ({ page }) => {
        await page.getByRole('button', { name: s.label, exact: true }).click();
        await expect(page.locator('[data-fit-report]')).toBeVisible();
        await page.locator('#fit-optional > summary').click();
        expect(await scan(page)).toEqual([]);
      });
    }

    test('a result shown: not enough to go on', async ({ page }) => {
      await page.locator('[data-fit-run]').click();
      await expect(page.locator('[data-fit-verdict]')).toHaveText('Not enough to go on');
      expect(await scan(page)).toEqual([]);
    });

    test('the brief dialog open', async ({ page }) => {
      await page.getByRole('button', { name: samples[0]?.label ?? '', exact: true }).click();
      await page.locator('[data-fit-brief-open]').click();
      await expect(page.locator('dialog[data-brief]')).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });
  });
}
