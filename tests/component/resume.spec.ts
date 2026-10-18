// Résumé dialog (F-04, design spec 7.13), print route (12.1) and the three PDFs (F-15, ADR-0010).
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { extractPdfText } from './pdf-text.ts';

type Role = { id: string; title: string; summary: string; pdfFile: string };
const roles = JSON.parse(readFileSync('src/content/roles.json', 'utf8')) as Role[];
const resume = JSON.parse(readFileSync('src/content/resume.json', 'utf8')) as {
  header: { name: string; email: string };
  education: { degree: string }[];
  experience: { company: string }[];
};
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const ml = roles.find((r) => r.id === 'ml')!;

const openDialog = async (page: Page) => {
  await page.goto('/');
  const opener = page.locator('.hero [data-resume-open]');
  await opener.click();
  return { opener, dialog: page.getByRole('dialog', { name: 'Résumé' }) };
};

test.describe('résumé dialog', () => {
  test('the tabs are in roles.json order and open on ML Engineer', async ({ page }) => {
    const { dialog } = await openDialog(page);
    const tabs = dialog.getByRole('tab');
    await expect(tabs).toHaveText(roles.map((r) => r.title));
    await expect(dialog.getByRole('tab', { name: ml.title })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(dialog.getByRole('tab', { name: ml.title })).toBeFocused();
    await expect(dialog.locator('[data-resume-summary]')).toHaveText(ml.summary);
  });

  test('arrows, Home and End move and select; only the selected tab is in the tab order', async ({
    page,
  }) => {
    const { dialog } = await openDialog(page);
    const tab = (r: Role) => dialog.getByRole('tab', { name: r.title });
    const [ai, , ds] = roles as [Role, Role, Role];
    await page.keyboard.press('ArrowLeft');
    await expect(tab(ai)).toBeFocused();
    await expect(tab(ai)).toHaveAttribute('aria-selected', 'true');
    await expect(dialog.locator('[data-resume-summary]')).toHaveText(ai.summary);
    await page.keyboard.press('ArrowLeft');
    await expect(tab(ds)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tab(ai)).toBeFocused();
    await page.keyboard.press('End');
    await expect(tab(ds)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tab(ai)).toBeFocused();
    await expect(dialog.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
    await expect(dialog.locator('[role="tab"][tabindex="-1"]')).toHaveCount(2);
  });

  test('the download link follows the tab and points at the role PDF', async ({ page }) => {
    const { dialog } = await openDialog(page);
    for (const r of roles) {
      await dialog.getByRole('tab', { name: r.title }).click();
      const link = dialog.getByRole('link', { name: /Download PDF/ });
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', `/resume/${r.pdfFile}`);
      await expect(link).toHaveAttribute('download', r.pdfFile);
    }
  });

  test('Escape and Close end it and focus returns to the opener', async ({ page }) => {
    const { opener, dialog } = await openDialog(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('.hero [data-resume-open]')).toBeFocused();
    await opener.click();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('the sheet shows the whole résumé, not only the summary', async ({ page }) => {
    const { dialog } = await openDialog(page);
    await expect(dialog).toContainText(resume.header.name);
    for (const c of resume.experience) await expect(dialog).toContainText(c.company);
    for (const e of resume.education) await expect(dialog).toContainText(e.degree);
  });

  test('the contact band opens the same dialog', async ({ page }) => {
    await page.goto('/');
    await page.locator('.contact [data-resume-open]').click();
    await expect(page.getByRole('dialog', { name: 'Résumé' })).toBeVisible();
  });

  for (const width of [390, 1280]) {
    for (const r of roles) {
      test(`axe: no violations with the dialog open on ${r.title} at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        const { dialog } = await openDialog(page);
        await dialog.getByRole('tab', { name: r.title }).click();
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(
          result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ).toEqual([]);
      });
    }
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('View résumé is a plain link to the ML Engineer PDF, and every PDF is linked', async ({
    page,
  }) => {
    await page.goto('/');
    const hero = page.locator('.hero').getByRole('link', { name: 'View résumé' });
    await expect(hero).toHaveAttribute('href', `/resume/${ml.pdfFile}`);
    for (const r of roles) {
      await expect(page.locator(`a[href="/resume/${r.pdfFile}"]`).first()).toBeAttached();
    }
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('print route', () => {
  for (const r of roles) {
    test(`/print/resume/${r.id}/ is noindex, has the role summary and no navigation`, async ({
      page,
      request,
    }) => {
      const res = await request.get(`/print/resume/${r.id}/`);
      expect(res.headers()['x-robots-tag']).toBe('noindex, nofollow');
      await page.goto(`/print/resume/${r.id}/`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.locator('nav, header.site-header')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(resume.header.name);
      await expect(page.locator('main')).toContainText(r.summary);
    });
  }

  test('print styles: black on white, 18 mm margins on Letter', async ({ page }) => {
    await page.goto('/print/resume/ml/');
    await page.emulateMedia({ media: 'print' });
    const colors = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { color: cs.color, background: cs.backgroundColor };
    });
    expect(colors).toEqual({ color: 'rgb(27, 26, 23)', background: 'rgb(255, 255, 255)' });
    const css = readFileSync('src/styles/print.css', 'utf8');
    expect(css).toMatch(/size:\s*letter/);
    expect(css).toMatch(/margin:\s*18mm/);
  });

  test('the sitemap does not list /print (the site has none)', async ({ request }) => {
    const res = await request.get('/sitemap-index.xml');
    if (res.ok()) expect(await res.text()).not.toContain('/print/');
  });
});

test.describe('résumé PDFs', () => {
  for (const r of roles) {
    test(`${r.pdfFile}: 1 to 2 pages, selectable text, no placeholders, same text as the print route`, async ({
      page,
    }) => {
      const pdf = readFileSync(`dist/resume/${r.pdfFile}`);
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      const { pages, text } = extractPdfText(pdf);
      expect(pages).toBeGreaterThanOrEqual(1);
      expect(pages).toBeLessThanOrEqual(2);
      const flat = text.replace(/\s+/g, ' ');
      expect(flat).toContain(resume.header.name);
      expect(flat).toContain(resume.header.email);
      for (const c of resume.experience) expect(flat).toContain(c.company);
      for (const e of resume.education) expect(flat).toContain(e.degree);
      expect(flat).toContain(r.summary);
      expect(text).not.toMatch(/\{\{|\}\}|undefined|\[object|\bnull\b|\bTODO\b/);
      // Whitespace and case aside, the PDF holds exactly the text of the print route.
      await page.goto(`/print/resume/${r.id}/`);
      await page.emulateMedia({ media: 'print' });
      const html = await page.locator('main').innerText();
      const squash = (s: string) => s.replace(/\s+/g, '').toLowerCase();
      expect(squash(text)).toBe(squash(html));
    });
  }

  test('the PDFs are served with the built site', async ({ request }) => {
    for (const r of roles) {
      const res = await request.get(`/resume/${r.pdfFile}`);
      expect(res.status()).toBe(200);
    }
  });
});
