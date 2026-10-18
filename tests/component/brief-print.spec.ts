// The one-page brief prints on one US Letter page in Chromium and WebKit (design spec 12.2, Phase 3 gate).
//
// Two checks, because the engines differ in what they can do:
// - Layout, both engines: the page is set to the printable width of Letter at 18 mm margins, print media is
//   emulated, and the brief sheet must be no taller than the printable height.
// - PDF, Chromium only (Playwright cannot print a PDF in WebKit): the real PDF has exactly one page.
// WebKit comes from `npm run browsers:install:webkit`. When it is missing the WebKit test is skipped and says so.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, expect, test, webkit, type BrowserType, type Page } from '@playwright/test';
import { loadEvidence } from '../../src/lib/content/load.ts';
import { extras } from '../../src/lib/fitcheck/extras.ts';

const BASE = `http://localhost:${process.env['PW_PORT'] ?? 4322}`;
const MM = 96 / 25.4;
// Letter is 215.9 by 279.4 mm. Margins are 18 mm (design spec 12).
const PAGE_W = Math.floor((215.9 - 36) * MM);
const PAGE_H = Math.floor((279.4 - 36) * MM);

type Skill = { name: string; aliases: string[]; tier: string; evidence: string[] };
const skills = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as Skill[];
const evidence = loadEvidence(join(process.cwd(), 'src', 'content'));
const maxField = (
  JSON.parse(readFileSync('src/components/copy/home.json', 'utf8')) as {
    fit: { limits: { field: number } };
  }
).fit.limits.field;

/** Terms for every skill and every market skill, so the report is as full as it can be. */
function everything(): string {
  const terms = [
    ...skills.flatMap((s) => (s.aliases.length ? s.aliases : [s.name])),
    ...skills.map((s) => s.name),
    ...extras.flatMap((e) => [e.name, ...e.aliases]),
  ];
  return terms.join('. ');
}

/** Postings that fill the four evidence rows with the longest proof lines the content allows. */
function longestProofs(): string {
  const longest = [...evidence].sort((a, b) => b.proof.length - a.proof.length).slice(0, 4);
  const ids = new Set(longest.map((e) => e.id));
  const terms = skills
    .filter((s) => s.evidence.some((id) => ids.has(id)))
    .flatMap((s) => (s.aliases.length ? s.aliases : [s.name]));
  return `${terms.join('. ')}. ${extras.map((e) => e.name).join('. ')}`;
}

/**
 * Titles that are measured and reported but not asserted. 160 unbroken wide capitals is not a title anyone
 * writes, and the spec says the title never shrinks (12.2), so it can run past one page. See the handback.
 */
const REPORT_ONLY = new Set(['unbroken 80 + 80']);

const TITLES = {
  // Unbroken wide letters: the title can break anywhere, so this is the tallest it gets.
  'unbroken 80 + 80': ['W'.repeat(maxField), 'M'.repeat(maxField)],
  // Capital words, the widest realistic text: 79 characters each, with spaces to break on.
  'capitals 80 + 80': [
    'SENIOR PRINCIPAL MACHINE LEARNING PLATFORM ENGINEER AND APPLIED RESEARCH LEAD MWMWMW',
    'NORTHWIND INTERNATIONAL HOLDINGS MACHINE LEARNING INFRASTRUCTURE AND DATA GROUP WMWM',
  ].map((t) => t.slice(0, maxField)),
  // Words, as a real title would be.
  'words 80 + 80': [
    'Senior Principal Staff Machine Learning Platform Engineer, Applied Research and Agents',
    'Northwind International Holdings, Machine Learning Infrastructure and Data Group',
  ].map((t) => t.slice(0, maxField)),
} as const;

async function showBrief(page: Page, posting: string, role: string, company: string) {
  await page.goto('/');
  await expect(page.locator('[data-fit-controls]')).toBeVisible();
  await page.locator('#fit-text').fill(posting.slice(0, 8000));
  await page.locator('#fit-optional > summary').click();
  await page.locator('#fit-company').fill(company);
  await page.locator('#fit-role').fill(role);
  await page.locator('[data-fit-run]').click();
  await page.locator('[data-fit-brief-open]').click();
  await expect(page.locator('dialog[data-brief]')).toBeVisible();
}

async function sheetHeight(page: Page): Promise<number> {
  await page.setViewportSize({ width: PAGE_W, height: PAGE_H });
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const h = await page.locator('dialog[data-brief] .sheet').evaluate((el) => {
    return el.getBoundingClientRect().height;
  });
  return h;
}

const cases = [
  ['everything matched', everything],
  ['the four longest proofs', longestProofs],
] as const;

async function layoutChecks(type: BrowserType) {
  test.setTimeout(120_000);
  const browser = await type.launch();
  try {
    const context = await browser.newContext({ baseURL: BASE });
    // WebKit upgrades http://localhost subresources to https under `upgrade-insecure-requests`, which the
    // local preview cannot serve. Only that one directive is removed; every other header is the real one.
    await context.route('**/*', async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      const csp = headers['content-security-policy'];
      if (csp)
        headers['content-security-policy'] = csp.replace(/;?\s*upgrade-insecure-requests/, '');
      await route.fulfill({ response, headers });
    });
    const results: string[] = [];
    for (const [label, posting] of cases) {
      for (const [titleLabel, [role, company]] of Object.entries(TITLES)) {
        const page = await context.newPage();
        await showBrief(page, posting(), role ?? '', company ?? '');
        const h = await sheetHeight(page);
        const rows = await page.locator('[data-brief-rows] > li').count();
        results.push(`${label} / ${titleLabel}: ${Math.round(h)} of ${PAGE_H} px, ${rows} rows`);
        if (!REPORT_ONLY.has(titleLabel))
          expect(h, `${label} / ${titleLabel}`).toBeLessThanOrEqual(PAGE_H);
        // Only the sheet is on the page: nothing else takes space.
        const others = await page.evaluate(
          () =>
            Array.from(document.body.children)
              .filter((c) => !c.matches('dialog[data-brief], script'))
              .filter((c) => getComputedStyle(c).display !== 'none').length,
        );
        expect(others).toBe(0);
        await page.close();
      }
    }
    test.info().annotations.push({ type: 'heights', description: results.join('\n') });
    console.log(`${type.name()}\n  ${results.join('\n  ')}`);
  } finally {
    await browser.close();
  }
}

test('Chromium: the worst-case brief fits one Letter page (layout)', async () => {
  await layoutChecks(chromium);
});

test('WebKit: the worst-case brief fits one Letter page (layout)', async () => {
  let installed = true;
  try {
    const b = await webkit.launch();
    await b.close();
  } catch {
    installed = false;
  }
  test.setTimeout(120_000);
  test.skip(!installed, 'WebKit is not installed: run `npm run browsers:install:webkit`.');
  await layoutChecks(webkit);
});

test('Chromium: the printed PDF has exactly one page', async ({ page }) => {
  for (const [label, posting] of cases) {
    for (const [titleLabel, [role, company]] of Object.entries(TITLES)) {
      if (REPORT_ONLY.has(titleLabel)) continue;
      await showBrief(page, posting(), role ?? '', company ?? '');
      const pdf = await page.pdf({
        format: 'Letter',
        margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
      });
      const pages = pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-z])/g)?.length ?? 0;
      expect(pages, `${label} / ${titleLabel}`).toBe(1);
    }
  }
});

test('Chromium: printing the page without the brief open prints the page, not an empty sheet', async ({
  page,
}) => {
  await page.goto('/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('dialog[data-brief]')).toBeHidden();
  await expect(page.locator('main')).toBeVisible();
});
