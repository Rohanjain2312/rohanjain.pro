// The fit-check section and the brief dialog, in a real browser against the built page served with the
// real CSP (tests/a11y/playwright.config.ts). Covers F-05, F-06, R-405 and 09-quality 9.5 property 9.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page, type Request } from '@playwright/test';
import fc from 'fast-check';
import { loadEvidence } from '../../src/lib/content/load.ts';
import { extras } from '../../src/lib/fitcheck/extras.ts';

type Sample = { id: string; label: string; company: string; title: string; jd: string };
const samples = JSON.parse(readFileSync('tests/fixtures/golden/samples.json', 'utf8')) as Sample[];
const verdicts = JSON.parse(readFileSync('tests/fixtures/golden/verdicts.json', 'utf8')) as {
  samples: Record<string, { expected: string }>;
};
const skills = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as {
  name: string;
}[];
const copy = (
  JSON.parse(readFileSync('src/components/copy/home.json', 'utf8')) as {
    fit: {
      notes: Record<string, string>;
      rampUp: string;
      brief: Record<string, string>;
      limits: { counterFrom: number; field: number };
    };
  }
).fit;
const evidence = loadEvidence(join(process.cwd(), 'src', 'content'));
const VERDICTS = ['Strong fit', 'Good fit, with gaps', 'Not a strong fit', 'Not enough to go on'];

/** Every string the report and the brief may show that is not a count: all of it is curated content. */
const curated = new Set<string>([
  ...VERDICTS,
  ...Object.values(copy.notes),
  copy.rampUp,
  ...skills.map((s) => s.name),
  ...extras.map((e) => e.name),
  ...evidence.flatMap((e) => [e.name, e.proof, ...(e.linkLabel ? [e.linkLabel] : [])]),
]);

const PAYLOADS = [
  '<script>window.__xss = 1</script>',
  '<img src=x onerror="window.__xss = 1">',
  '<a href="javascript:window.__xss=1">click</a> javascript:window.__xss=1',
  '"><svg onload=window.__xss=1>',
  '<iframe srcdoc="<script>parent.__xss=1</script>"></iframe>',
  '{{constructor.constructor("window.__xss=1")()}} ${window.__xss=1} $& $1 {role} {company}',
  '</dialog><h1 id="injected">x</h1>',
];

async function open(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-fit-controls]')).toBeVisible();
}

async function runCheck(page: Page, text: string, company = '', role = '') {
  await page.locator('#fit-text').fill(text);
  if (company || role) {
    await page.locator('#fit-optional > summary').click();
    await page.locator('#fit-company').fill(company);
    await page.locator('#fit-role').fill(role);
  }
  await page.locator('[data-fit-run]').click();
}

test.describe('section', () => {
  test('has the label, heading, intro and controls in order', async ({ page }) => {
    await open(page);
    await expect(page.locator('#fit .fit__label')).toHaveText('check fit');
    await expect(page.locator('#fit h2')).toHaveText('Hiring? Paste the job description.');
    await expect(page.locator('main h2')).toHaveText([
      'Goldman Sachs · Data Scientist',
      'Four projects, real numbers',
      'Hiring? Paste the job description.',
      'Have a role in mind?',
    ]);
    await expect(page.locator('[data-fit-sample]')).toHaveText(samples.map((s) => s.label));
    await expect(page.locator('[data-fit-report]')).toBeHidden();
  });

  test('caps the posting at 8,000 and the fields at 80, and shows the counter from 7,000', async ({
    page,
  }) => {
    await open(page);
    const area = page.locator('#fit-text');
    await expect(area).toHaveAttribute('maxlength', '8000');
    await expect(page.locator('#fit-company')).toHaveAttribute('maxlength', '80');
    await expect(page.locator('#fit-role')).toHaveAttribute('maxlength', '80');
    await expect(page.locator('[data-fit-count]')).toBeHidden();
    await area.fill('a'.repeat(copy.limits.counterFrom - 2));
    await area.press('End');
    await page.keyboard.type('b');
    await expect(page.locator('[data-fit-count]')).toBeHidden();
    await page.keyboard.type('b');
    await expect(page.locator('[data-fit-count]')).toHaveText('7,000 / 8,000');
    await area.fill('x'.repeat(9000));
    expect(await area.inputValue()).toHaveLength(8000);
    await expect(page.locator('[data-fit-count]')).toHaveText('8,000 / 8,000');
    await expect(area).toHaveAttribute('aria-describedby', 'fit-count');
    await page.locator('#fit-optional > summary').click();
    await page.locator('#fit-company').fill('c'.repeat(120));
    expect(await page.locator('#fit-company').inputValue()).toHaveLength(80);
  });

  for (const s of samples) {
    test(`the ${s.label} sample fills the fields and shows its expected verdict`, async ({
      page,
    }) => {
      await open(page);
      const button = page.getByRole('button', { name: s.label, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#fit-text')).toHaveValue(s.jd);
      await expect(page.locator('#fit-company')).toHaveValue(s.company);
      await expect(page.locator('#fit-role')).toHaveValue(s.title);
      await expect(page.locator('[data-fit-verdict]')).toHaveText(
        verdicts.samples[s.id]?.expected ?? 'missing',
      );
      await expect(page.locator('[data-fit-box]')).toHaveAttribute(
        'data-verdict',
        /^(strong|good|weak|none)$/,
      );
      // Pressed clears when the textarea is edited.
      await page.locator('#fit-text').press('End');
      await page.keyboard.type(' ');
      await expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  }

  test('a strong result shows counts, the fixed paragraph, at most 4 rows with tags, and the gaps', async ({
    page,
  }) => {
    await open(page);
    await page.getByRole('button', { name: 'AI Engineer', exact: true }).click();
    const box = page.locator('[data-fit-box]');
    await expect(box).toHaveAttribute('data-verdict', /strong|good/);
    await expect(page.locator('[data-fit-counts]')).toHaveText(/^\d+ proven · \d+ to ramp up$/);
    const key = await box.getAttribute('data-verdict');
    await expect(page.locator('[data-fit-note]')).toHaveText(
      copy.notes[key ?? ''] ?? 'missing note',
    );
    const rows = page.locator('[data-fit-rows] > li');
    expect(await rows.count()).toBeGreaterThan(0);
    expect(await rows.count()).toBeLessThanOrEqual(4);
    for (const chips of await rows.locator('.chips').all()) {
      const n = await chips.locator('li').count();
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThanOrEqual(8);
    }
    await expect(page.locator('[data-fit-gaps]')).toContainText(copy.rampUp);
    await expect(page.getByRole('link', { name: 'Forward to the hiring manager' })).toHaveAttribute(
      'href',
      'mailto:?subject=Candidate%3A%20Rohan%20Jain',
    );
  });

  test('an empty posting says there is not enough to go on and renders no rows or gaps', async ({
    page,
  }) => {
    await open(page);
    await runCheck(page, '');
    await expect(page.locator('[data-fit-verdict]')).toHaveText('Not enough to go on');
    await expect(page.locator('[data-fit-box]')).toHaveAttribute('data-verdict', 'none');
    await expect(page.locator('[data-fit-note]')).toHaveText(copy.notes['none'] ?? 'missing');
    await expect(page.locator('[data-fit-rows]')).toBeHidden();
    await expect(page.locator('[data-fit-gaps]')).toBeHidden();
  });

  test('evidence rows link only to https URLs from the evidence list', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'AI Engineer', exact: true }).click();
    const hrefs = await page
      .locator('[data-fit-rows] a')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);
    const allowed = new Set(evidence.map((e) => e.href));
    for (const h of hrefs) {
      expect(h).toMatch(/^https:\/\//);
      expect(allowed.has(h ?? '')).toBe(true);
    }
  });

  test('the status line announces the verdict', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'iOS Engineer', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(
      new RegExp(`^${verdicts.samples['ios']?.expected}\\. \\d+ proven · \\d+ to ramp up$`),
    );
  });
});

test.describe('privacy', () => {
  test('the posting goes nowhere and nothing is stored', async ({ page }) => {
    const requests: Request[] = [];
    page.on('request', (r) => requests.push(r));
    await open(page);
    await page.waitForLoadState('networkidle');
    const before = requests.length;
    await runCheck(page, 'marker-posting-text Python Docker', 'MarkerCo', 'MarkerRole');
    await page.locator('[data-fit-brief-open]').click();
    await page.keyboard.press('Escape');
    for (const s of samples) await page.getByRole('button', { name: s.label, exact: true }).click();
    // Later requests may only be the page's own static files (fonts, a lazy image): same-origin GETs
    // with no body, and nothing carrying the posting.
    for (const r of requests.slice(before)) {
      expect(r.method()).toBe('GET');
      expect(new URL(r.url()).origin).toBe(new URL(page.url()).origin);
      expect(r.postData()).toBeNull();
      expect(r.url()).not.toMatch(/marker/i);
      expect(['image', 'font', 'stylesheet', 'script']).toContain(r.resourceType());
    }
    const stored = await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
      title: document.title,
      url: location.href,
    }));
    expect(stored.local).toBe(0);
    expect(stored.session).toBe(0);
    expect(stored.cookie).toBe('');
    expect(stored.url).not.toContain('marker');
  });

  test('the shipped script has no HTML sink, storage or network call', async ({ page }) => {
    await page.goto('/');
    const src = await page.evaluate(async () => {
      const urls = Array.from(document.scripts)
        .map((s) => s.src)
        .filter((u) => u.includes('FitCheck'));
      const texts: string[] = [];
      for (const u of urls) texts.push(await (await fetch(u)).text());
      return texts.join('\n');
    });
    expect(src.length).toBeGreaterThan(1000);
    for (const bad of [
      /\.innerHTML\s*=/,
      /\.outerHTML\s*=/,
      /insertAdjacentHTML/,
      /document\.write/,
      /\beval\(/,
      /new Function/,
      /localStorage|sessionStorage|indexedDB/,
      /XMLHttpRequest|sendBeacon|WebSocket/,
      /\bfetch\(/,
    ]) {
      expect(src).not.toMatch(bad);
    }
  });
});

test.describe('XSS payloads render as inert text (R-405)', () => {
  const injectedAfter = async (page: Page) =>
    page.evaluate(() => ({
      fired: (window as unknown as { __xss?: number }).__xss ?? 0,
      injected: document.querySelectorAll('#injected, [onerror], [onload], [srcdoc]').length,
      jsLinks: document.querySelectorAll('a[href^="javascript:" i]').length,
      scripts: Array.from(document.scripts).filter((s) => !s.src).length,
      iframes: document.querySelectorAll('iframe').length,
    }));

  for (const payload of PAYLOADS) {
    test(`posting and fields: ${payload.slice(0, 40)}`, async ({ page }) => {
      await open(page);
      await runCheck(
        page,
        `${payload} Python Docker Kubernetes AWS SQL ${payload}`,
        payload.slice(0, 80),
        payload.slice(0, 80),
      );
      await page.locator('[data-fit-brief-open]').click();
      await expect(page.locator('dialog[data-brief]')).toBeVisible();
      const title = page.locator('[data-brief-title]');
      expect(await title.locator('*').count()).toBe(0);
      expect(await title.textContent()).toContain(payload.slice(0, 20));
      expect(await injectedAfter(page)).toEqual({
        fired: 0,
        injected: 0,
        jsLinks: 0,
        scripts: 0,
        iframes: 0,
      });
    });
  }
});

test.describe('property 9: any string renders only curated strings and adds no elements', () => {
  test('generated postings and fields', async ({ page }) => {
    await open(page);
    await page.locator('#fit-optional > summary').click();
    const arb = fc.oneof(
      fc.string({ maxLength: 300 }),
      fc.string({ unit: 'binary', maxLength: 300 }),
      fc.constantFrom(...PAYLOADS),
      fc
        .tuple(fc.constantFrom(...PAYLOADS), fc.constantFrom(...skills.map((s) => s.name)))
        .map(([p, s]) => `${p} ${s} ${p}`),
    );
    const inputs = fc.sample(fc.tuple(arb, arb, arb), { numRuns: 40, seed: 20261017 });
    const shape = () =>
      page.evaluate(() => {
        const leaves = (root: Element | null) =>
          Array.from(root?.querySelectorAll('*') ?? [])
            .filter((n) => n.children.length === 0)
            .map((n) => (n.textContent ?? '').trim())
            .filter(Boolean);
        const tags = (root: Element | null) =>
          Array.from(new Set(Array.from(root?.querySelectorAll('*') ?? []).map((n) => n.tagName)));
        const report = document.querySelector('[data-fit-report]');
        const sheet = document.querySelector('[data-brief] .sheet');
        return {
          reportLeaves: leaves(report),
          reportTags: tags(report),
          sheetTags: tags(sheet),
          // The brief title and the field values are the only places visitor text may appear.
          titleChildren: document.querySelector('[data-brief-title]')?.children.length ?? -1,
          scripts: document.scripts.length,
        };
      });
    const baseline = (await shape()).scripts;
    const allowedTags = [
      'DIV',
      'P',
      'SPAN',
      'UL',
      'LI',
      'A',
      'STRONG',
      'ARTICLE',
      'BUTTON',
      'HEADER',
      'H2',
      'H3',
      'SECTION',
    ];
    for (const [text, company, role] of inputs) {
      await runCheck(page, text);
      await page.locator('#fit-company').fill(company);
      await page.locator('#fit-role').fill(role);
      await page.locator('[data-fit-run]').click();
      await page.locator('[data-fit-brief-open]').click();
      await page.keyboard.press('Escape');
      const r = await shape();
      for (const leaf of r.reportLeaves) {
        const bare = leaf.replace(/^[●○]\s*/, '').replace(/\s*↗$/, '');
        const ok =
          curated.has(bare) ||
          /^\d+ proven · \d+ to ramp up$/.test(leaf) ||
          /^[●○↗]$/.test(leaf) ||
          leaf === 'Forward to the hiring manager' ||
          leaf === 'Open the one-page brief' ||
          /^for .+$/.test(leaf);
        expect(ok, `not curated: ${JSON.stringify(leaf)}`).toBe(true);
      }
      for (const t of [...r.reportTags, ...r.sheetTags]) expect(allowedTags).toContain(t);
      expect(r.titleChildren).toBe(0);
      expect(r.scripts).toBe(baseline);
    }
  });
});

test.describe('brief dialog', () => {
  test('shows title, contact, verdict, evidence and background from the result', async ({
    page,
  }) => {
    await open(page);
    await runCheck(page, samples[0]?.jd ?? '', 'Acme', 'Staff AI Engineer');
    await page.locator('[data-fit-brief-open]').click();
    const dialog = page.locator('dialog[data-brief]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(
      'Rohan Jain for Staff AI Engineer at Acme',
    );
    await expect(dialog.locator('.sheet__label')).toHaveText(
      /^CANDIDATE BRIEF · [A-Z][a-z]{2} \d{4}$/i,
    );
    await expect(dialog.locator('.sheet__contact')).toHaveText(
      'rohanjain2312@gmail.com · (240) 495-9682 · New York, NY · available now',
    );
    await expect(dialog.locator('[data-brief-verdict]')).toHaveText(
      await page.locator('[data-fit-verdict]').innerText(),
    );
    const first = await dialog.locator('[data-brief-rows] > li strong').first().innerText();
    expect(evidence.map((e) => `${e.name}.`)).toContain(first);
    await expect(dialog.getByRole('button', { name: copy.brief['save'] ?? '' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: copy.brief['close'] ?? '' })).toBeVisible();
  });

  test('with no title and no company the title reads "for your role"', async ({ page }) => {
    await open(page);
    await runCheck(page, samples[0]?.jd ?? '');
    await page.locator('[data-fit-brief-open]').click();
    await expect(page.locator('[data-brief-title]')).toHaveText('Rohan Jain for your role');
  });

  test('the brief follows the last run, not the fields as edited since', async ({ page }) => {
    await open(page);
    await runCheck(page, samples[0]?.jd ?? '', 'FirstCo', 'First Role');
    await page.locator('#fit-company').fill('SecondCo');
    await page.locator('[data-fit-brief-open]').click();
    await expect(page.locator('[data-brief-title]')).toHaveText(
      'Rohan Jain for First Role at FirstCo',
    );
  });
});

test.describe('keyboard only', () => {
  test('samples, textarea, fields, check, brief, Escape and focus return', async ({ page }) => {
    await open(page);
    const focused = () =>
      page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        return a?.id || a?.getAttribute('data-fit-run') !== null
          ? (a?.id ?? '') || 'run'
          : (a?.textContent ?? '').trim();
      });
    // Start at the first sample and tab forward.
    await page.locator('[data-fit-sample]').first().focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await focused()).toBe('fit-text');
    await page.keyboard.type('Python Docker Kubernetes AWS SQL LangGraph');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('SUMMARY');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    expect(await focused()).toBe('fit-company');
    await page.keyboard.type('Acme');
    await page.keyboard.press('Tab');
    expect(await focused()).toBe('fit-role');
    await page.keyboard.type('ML Engineer');
    await page.keyboard.press('Tab');
    expect(await focused()).toBe('run');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-fit-report]')).toBeVisible();
    // Focus stays on the button, so the result does not move the reader.
    expect(await focused()).toBe('run');
    const opener = page.locator('[data-fit-brief-open]');
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('dialog[data-brief]');
    await expect(dialog).toBeVisible();
    // Focus is in the dialog, or on the body while it passes through the browser's own controls.
    const inside = () =>
      page.evaluate(
        () =>
          document.activeElement === document.body ||
          (document.querySelector('dialog[data-brief]')?.contains(document.activeElement) ?? false),
      );
    expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(
      true,
    );
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await inside()).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    // And through the Close button.
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: copy.brief['close'] ?? '' }).focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('the page does not scroll behind the open dialog', async ({ page }) => {
    await open(page);
    await runCheck(page, samples[0]?.jd ?? '');
    await page.locator('[data-fit-brief-open]').click();
    const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    expect(overflow).toBe('hidden');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows the notice and no controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#fit h2')).toBeVisible();
    await expect(page.locator('.fit__notice')).toBeVisible();
    await expect(page.locator('[data-fit-controls]')).toBeHidden();
    await expect(page.locator('dialog[data-brief]')).toBeHidden();
  });
});
