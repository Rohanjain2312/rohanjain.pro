// Click-to-load demo embeds (F-09, R-512) and the footer status line.
import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const FINCOMPRESS = 'https://rohanjain2312-fincompress.hf.space';

test.beforeEach(async ({ page }) => {
  // No test reaches the real network: hf.space requests get an empty page.
  await page.route('https://*.hf.space/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>demo</p>' }),
  );
});

test.describe('demo dialog', () => {
  test('nothing from hf.space loads, and no iframe exists, before the click', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('/');
    await page.getByRole('link', { name: /try it here for FinCompress/ }).waitFor();
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(requests.filter((u) => u.includes('hf.space'))).toEqual([]);
  });

  test('the trigger opens the dialog in its static state, still with no iframe', async ({
    page,
  }) => {
    await page.goto('/');
    const trigger = page.getByRole('link', { name: /try it here for FinCompress/ });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Live demo' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-demo-title]')).toHaveText('FinCompress');
    await expect(dialog.getByRole('button', { name: 'Load live demo' })).toBeVisible();
    await expect(dialog).toContainText('Free demos can take up to a minute to wake.');
    await expect(dialog.getByRole('link', { name: /live demo/ })).toHaveAttribute(
      'href',
      /^https:\/\/huggingface\.co\/spaces\//,
    );
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('Load live demo creates a sandboxed iframe on the hf.space host; closing removes it', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /try it here for FinCompress/ }).click();
    await page.getByRole('button', { name: 'Load live demo' }).click();
    const frame = page.locator('iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', FINCOMPRESS);
    await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(frame).toHaveAttribute('loading', 'lazy');
    await expect(frame).toHaveAttribute('title', /FinCompress/);
    // Audit A-1: focus moves to the demo when the load button hides.
    await expect(page.locator('[data-demo-stage]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /try it here for FinCompress/ })).toBeFocused();
  });

  test('the Close button closes the dialog', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /try it here for FinCompress/ }).click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('without JavaScript the trigger is a plain link to the Space', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByRole('link', { name: /try it here for FinCompress/ })).toHaveAttribute(
      'href',
      'https://huggingface.co/spaces/rohanjain2312/FinCompress',
    );
    await expect(page.locator('dialog.demo')).toBeHidden();
    await context.close();
  });
});

test.describe('footer status', () => {
  test('is absent when public/status.json does not exist', async ({ page }) => {
    test.skip(existsSync('public/status.json'), 'a status.json is present in this build');
    await page.goto('/');
    await expect(page.locator('.site-footer__status')).toHaveCount(0);
    await expect(page.locator('.footer-link')).toHaveCount(5);
  });
});
