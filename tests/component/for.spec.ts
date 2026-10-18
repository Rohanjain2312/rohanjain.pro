// /for/<slug> (F-07, R-503) built from result files outside the repo. The fixtures are made at test time:
// a synthetic posting goes through the real generator (scripts/for.ts), a second result is aged to be expired.
// Nothing is written inside the repo and no result file or posting is ever committed (R-501, R-502).
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { applicationResultSchema, SLUG_PATTERN } from '../../src/lib/applications/index.ts';

const PORT = 4333;
const BASE = `http://localhost:${PORT}`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const ROLE = 'Staff Widget Engineer';
const COMPANY = 'Northwind Fixture';
const EXPIRED_COMPANY = 'Hidden Fixture Corp';
const JD_MARKER = 'quokka-marker-sentence-for-leak-test';
const POSTING = [
  `We are hiring an AI Engineer. ${JD_MARKER}.`,
  'You will build LLM agents with LangGraph, retrieval augmented generation and tool calling.',
  'Python, SQL, Docker and Kubernetes are required. Experience with vLLM is a plus.',
].join('\n');

let work = '';
let live = '';
let expired = '';
let server: ChildProcess | undefined;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  test.setTimeout(240_000);
  work = mkdtempSync(join(tmpdir(), 'for-fixture-'));
  const apps = join(work, 'applications');
  mkdirSync(apps);
  writeFileSync(join(work, 'posting.txt'), POSTING);
  const gen = (company: string) =>
    spawnSync(
      'node',
      [
        'scripts/for.ts',
        '--company',
        company,
        '--role',
        ROLE,
        '--jd',
        join(work, 'posting.txt'),
        '--out',
        apps,
      ],
      { encoding: 'utf8' },
    );
  expect(gen(COMPANY).status).toBe(0);
  const before = new Set(readdirSync(apps));
  expect(gen(EXPIRED_COMPANY).status).toBe(0);
  const files = readdirSync(apps);
  const old = files.find((f) => !before.has(f))!;
  live = files.find((f) => f !== old)!.replace(/\.json$/, '');
  expired = old.replace(/\.json$/, '');
  // Age the second result so it is past its expiry date.
  const data = JSON.parse(readFileSync(join(apps, old), 'utf8')) as Record<string, unknown>;
  data['created'] = '2020-01-01';
  data['expires'] = '2020-04-01';
  applicationResultSchema.parse(data);
  writeFileSync(join(apps, old), JSON.stringify(data));

  const dist = join(work, 'dist');
  const build = spawnSync('npx', ['astro', 'build', '--outDir', dist], {
    env: { ...process.env, APPLICATIONS_DIR: apps },
    encoding: 'utf8',
  });
  expect(build.status, build.stderr).toBe(0);
  server = spawn('node', ['scripts/preview.mjs', '--port', String(PORT), '--dir', dist], {
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start');
});

test.afterAll(() => {
  server?.kill('SIGKILL');
  if (work) rmSync(work, { recursive: true, force: true });
});

test('slugs follow the pattern', () => {
  expect(live).toMatch(SLUG_PATTERN);
  expect(expired).toMatch(SLUG_PATTERN);
});

test('live page: content from the result, noindex in meta and header', async ({ page }) => {
  const res = await page.goto(`${BASE}/for/${live}/`);
  expect(res?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page).toHaveTitle(`Rohan Jain for ${COMPANY}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Rohan Jain, for ${COMPANY}`);
  await expect(page.locator('.for-bar')).toContainText(`prepared for ${COMPANY} · ${ROLE}`);
  await expect(page.locator('.for-bar')).toContainText(`rohanjain.pro/for/${live}`);
  await expect(page.locator('.verdict')).toContainText(
    /Strong fit|Good fit, with gaps|Not a strong fit|Not enough to go on/,
  );
  await expect(page.locator('.verdict__counts')).toContainText(/\d+ proven · \d+ to ramp up/);
  await expect(page.locator('.evidence__row').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the ML Engineer résumé' })).toHaveAttribute(
    'href',
    '/resume/Rohan-Jain-ML-Engineer.pdf',
  );
  await expect(page.getByRole('link', { name: /rohanjain2312@gmail.com/ })).toHaveAttribute(
    'href',
    /^mailto:rohanjain2312@gmail\.com\?subject=Northwind%20Fixture%3A%20Staff%20Widget%20Engineer$/,
  );
  await expect(page.getByRole('link', { name: /see everything else/ })).toHaveAttribute(
    'href',
    '/',
  );
  await expect(page.getByRole('button', { name: /brief/i })).toHaveCount(0);
});

test('live page renders result text as text, with no job description in the HTML', async ({
  request,
}) => {
  const html = await (await request.get(`${BASE}/for/${live}/`)).text();
  expect(html).not.toContain(JD_MARKER);
  expect(html).not.toContain('retrieval augmented generation');
  expect(html).not.toMatch(/<script[^>]*>[^<]/i);
  expect(html).not.toContain('style="');
});

test('expired page: notice and link to the main site, nothing about the application', async ({
  page,
  request,
}) => {
  const res = await page.goto(`${BASE}/for/${expired}/`);
  expect(res?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page has expired');
  await expect(page.getByRole('link', { name: /back to rohanjain\.pro/ })).toHaveAttribute(
    'href',
    '/',
  );
  const html = await (await request.get(`${BASE}/for/${expired}/`)).text();
  expect(html).not.toContain(EXPIRED_COMPANY);
  expect(html).not.toContain(ROLE);
  expect(html).not.toMatch(/verdict|evidence/i);
  expect(html).not.toContain(JD_MARKER);
});

test('there is no index of /for pages and unknown slugs are 404', async ({ request }) => {
  for (const path of [
    '/for',
    '/for/',
    '/for/unknown-abcdef/',
    '/for/northwind-fixture/',
    `/for/${live}-x/`,
  ]) {
    expect((await request.get(`${BASE}${path}`)).status(), path).toBe(404);
  }
});

test('nothing links to /for and there is no sitemap', async ({ request }) => {
  for (const path of ['/sitemap.xml', '/sitemap-index.xml', '/sitemap-0.xml']) {
    expect((await request.get(`${BASE}${path}`)).status(), path).toBe(404);
  }
  const robots = await request.get(`${BASE}/robots.txt`);
  if (robots.ok()) expect(await robots.text()).not.toContain('/for');
  for (const path of ['/', '/privacy/', '/404.html', `/for/${live}/`, `/for/${expired}/`]) {
    const html = await (await request.get(`${BASE}${path}`)).text();
    expect(html, path).not.toMatch(/href="\/for\b/);
    expect(html, path).not.toMatch(/href="[^"]*rohanjain\.pro\/for/);
  }
});

for (const which of ['live', 'expired'] as const) {
  for (const width of [390, 1280]) {
    test(`axe: no violations on the ${which} page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/for/${which === 'live' ? live : expired}/`);
      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(
        result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    });
  }
}

test('the repository holds no result files', () => {
  const dir = 'src/content/applications';
  expect(readdirSync(dir).filter((n) => n !== '.gitkeep')).toEqual([]);
});

// Captures for design review (not baselines), written next to the other screenshots.
for (const which of ['live', 'expired'] as const) {
  for (const width of [390, 768, 1280]) {
    test(`capture the ${which} /for page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/for/${which === 'live' ? live : expired}/`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `tests/visual/screenshots/for-${which}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
