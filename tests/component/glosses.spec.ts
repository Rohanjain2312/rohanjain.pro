// Every plain-words gloss in copy/home.json must render on the built home page (a dropped gloss fails here).
import { expect, test } from '@playwright/test';
import copy from '../../src/components/copy/home.json' with { type: 'json' };

test('every gloss renders on the home page', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('body').evaluate((el) => el.textContent ?? '');
  const flat = text.replace(/\s+/g, ' ');
  for (const gloss of [
    ...Object.values(copy.glosses.projects),
    ...Object.values(copy.glosses.figures),
  ]) {
    expect(flat, gloss).toContain(gloss);
  }
});
