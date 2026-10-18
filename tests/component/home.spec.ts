// Behavior and structure of the built pages, served with the real CSP (see tests/a11y/playwright.config.ts).
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

type Claim = { id: string; value: number | string; display: string };
const claims = JSON.parse(readFileSync('src/content/claims.json', 'utf8')) as Claim[];
const claim = (id: string): Claim => {
  const c = claims.find((x) => x.id === id);
  if (!c) throw new Error(`no claim ${id}`);
  return c;
};

const WIDTHS = [320, 390, 768, 1280];

test.describe('no inline code', () => {
  for (const path of ['/', '/privacy/', '/404.html']) {
    test(`${path} has no style attribute, inline style or inline script, and no CSP violation`, async ({
      page,
    }) => {
      const violations: string[] = [];
      page.on('console', (m) => {
        if (/content security policy/i.test(m.text())) violations.push(m.text());
      });
      await page.goto(path);
      await page.evaluate(() => {
        for (const d of document.querySelectorAll('details')) d.open = true;
      });
      const found = await page.evaluate(() => ({
        styleAttrs: document.querySelectorAll('[style]').length,
        styleTags: document.querySelectorAll('style').length,
        inlineScripts: Array.from(document.querySelectorAll('script')).filter((s) => !s.src).length,
      }));
      expect(found).toEqual({ styleAttrs: 0, styleTags: 0, inlineScripts: 0 });
      expect(violations).toEqual([]);
    });
  }
});

test.describe('layout', () => {
  for (const width of WIDTHS) {
    for (const path of ['/', '/privacy/', '/404.html']) {
      test(`${path} does not scroll sideways at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.evaluate(() => {
          for (const d of document.querySelectorAll('details')) d.open = true;
        });
        const widths = await page.evaluate(() => ({
          doc: document.documentElement.scrollWidth,
          view: document.documentElement.clientWidth,
        }));
        expect(widths.doc).toBeLessThanOrEqual(widths.view);
      });
    }
  }

  test('text links and nav links keep a 44 px hit area', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/');
    const small = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '.nav-link, .text-link, .footer-link, .wordmark, .row__link, .timeline__entry',
        ),
      )
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ cls: el.className, w: el.offsetWidth, h: el.offsetHeight }))
        .filter((r) => r.h < 44 || r.w < 44),
    );
    expect(small).toEqual([]);
  });

  test('boxed controls are 48 px high', async ({ page }) => {
    await page.goto('/');
    const heights = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.btn, .fold__summary'))
        .filter((el) => el.offsetParent !== null)
        .map((el) => Math.round(el.getBoundingClientRect().height)),
    );
    expect(heights.length).toBeGreaterThan(0);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(48);
  });
});

test.describe('home content', () => {
  test('the results strip shows numbers from claims.json', async ({ page }) => {
    await page.goto('/');
    const figures = await page.locator('.results__figure').allTextContents();
    expect(figures).toEqual([
      `${claim('settlement-pending-trades-reduction').value}%`,
      `${claim('loan-v1-hours-saved').value} hrs`,
      `${claim('tariff-exact-match').value}%`,
    ]);
  });

  test('landmarks, one h1, and the sections in order', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('header nav a')).toHaveText(['work', 'contact']);
    const headings = await page.locator('main h2').allTextContents();
    expect(headings).toEqual([
      'Goldman Sachs · Data Scientist',
      'Four projects, real numbers',
      'Have a role in mind?',
    ]);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
  });

  test('cards come from projects.json and demos link out to the Space', async ({ page }) => {
    await page.goto('/');
    const projects = JSON.parse(readFileSync('src/content/projects.json', 'utf8')) as {
      name: string;
      featured: boolean;
      demo?: { url: string };
    }[];
    const featured = projects.filter((p) => p.featured);
    await expect(page.locator('.card h3')).toHaveText(featured.map((p) => p.name));
    for (const p of featured.filter((x) => x.demo)) {
      const demo = page.locator(`.card:has(h3:text-is("${p.name}")) a[href="${p.demo?.url}"]`);
      await expect(demo).toHaveCount(1);
      expect(p.demo?.url).toMatch(/^https:\/\/huggingface\.co\/spaces\//);
    }
    await expect(page.locator('.rows .row')).toHaveCount(projects.length - featured.length);
  });

  test('contact has the email, the phone and four profile links', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('#contact');
    await expect(contact.locator('a[href^="mailto:rohanjain2312@gmail.com"]')).toHaveCount(1);
    await expect(contact.locator('a[href="tel:+12404959682"]')).toHaveText('(240) 495-9682');
    await expect(contact.locator('a[href^="https://"]')).toHaveCount(4);
    await expect(contact.locator('a', { hasText: 'Writing' })).toHaveAttribute(
      'href',
      'https://medium.com/@rohanjain2312',
    );
  });

  test('footer links to the privacy page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL(/\/privacy\/$/);
    await expect(page.locator('h1')).toHaveText('What this site collects');
  });
});

test.describe('folds', () => {
  test('are native details that open and close from the keyboard', async ({ page }) => {
    await page.goto('/');
    const summary = page.locator('summary', { hasText: 'What I built there' });
    const details = page.locator('details', { has: summary });
    await expect(details).not.toHaveAttribute('open', '');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open', '');
  });

  test('the marker does not animate under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const duration = await page
      .locator('.fold__plus')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe('0s');
  });
});

test.describe('figures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('summary', { hasText: 'Figures from the repos' }).click();
  });

  test('every figure has a tile, images have alt text, bars have visible values', async ({
    page,
  }) => {
    const figures = JSON.parse(readFileSync('src/content/figures.json', 'utf8')) as {
      id: string;
      kind: string;
      alt: string;
    }[];
    await expect(page.locator('.tile')).toHaveCount(figures.length);
    for (const f of figures.filter((x) => x.kind === 'image')) {
      await expect(page.locator(`#fig-${f.id} img`)).toHaveAttribute('alt', f.alt);
    }
    const img = page.locator('.tile img').first();
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
    await expect(page.locator('#fig-gb-bars .bar__text')).toHaveText([
      /GraphRAG\s*3\.2%/,
      /GNN-RAG\s*5\.0%/,
    ]);
  });

  test('timeline entries become buttons that highlight a project and toggle off', async ({
    page,
  }) => {
    const entry = page.getByRole('button', { name: 'Settlement Fail Predictor' });
    await expect(entry).toHaveAttribute('aria-pressed', 'false');
    await entry.click();
    await expect(entry).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.tile[data-selected="true"]')).toHaveCount(2);
    await entry.click();
    await expect(page.locator('.tile[data-selected="true"]')).toHaveCount(0);
  });

  test('the career steps built from claims have no button', async ({ page }) => {
    await expect(page.locator('.timeline__plain')).toHaveText(['Goldman Sachs', 'MS, Maryland']);
    await expect(page.locator('.timeline time').first()).toHaveText('2021');
    const second = page.locator('.timeline time').nth(1);
    await expect(second).toHaveText('2024');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('timeline entries are anchors to the first matching tile', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a.timeline__entry', { hasText: 'FinCompress' });
    await expect(link).toHaveAttribute('href', '#fig-fc-pruning');
    await expect(page.locator('#fig-fc-pruning')).toHaveCount(1);
  });
});

test.describe('404', () => {
  test('an unknown path returns the crash page with status 404', async ({ page }) => {
    const res = await page.goto('/no-such-page/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Run crashed. Loss is NaN.');
    await expect(page.locator('.trace-error')).toHaveText('RuntimeError: run crashed, loss is NaN');
    await expect(
      page.getByRole('link', { name: /restart from the last checkpoint/ }),
    ).toHaveAttribute('href', '/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('the traceback keeps its line breaks', async ({ page }) => {
    await page.goto('/404.html');
    const text = await page.locator('.trace').innerText();
    expect(text.split('\n')).toHaveLength(9);
  });
});
