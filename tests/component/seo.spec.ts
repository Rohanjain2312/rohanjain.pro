// SEO tags, sitemap.xml, robots.txt and the JSON-LD block (F-12), checked on the built pages.
import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'https://rohanjain.pro';
const meta = (page: Page, sel: string) => page.locator(`head meta[${sel}]`).getAttribute('content');
const hasOg = existsSync('dist/og.png');

for (const [path, canonical] of [
  ['/', `${ORIGIN}/`],
  ['/privacy/', `${ORIGIN}/privacy/`],
] as const) {
  test(`${path} has title, description, canonical and social tags`, async ({ page }) => {
    await page.goto(path);
    const title = await page.title();
    const description = await meta(page, 'name="description"');
    expect(title.length).toBeGreaterThan(0);
    expect(description?.length).toBeGreaterThan(0);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', canonical);
    expect(await meta(page, 'property="og:title"')).toBe(title);
    expect(await meta(page, 'property="og:description"')).toBe(description);
    expect(await meta(page, 'property="og:url"')).toBe(canonical);
    expect(await meta(page, 'property="og:type"')).toBe('website');
    expect(await meta(page, 'name="twitter:title"')).toBe(title);
    if (hasOg) {
      expect(await meta(page, 'property="og:image"')).toBe(`${ORIGIN}/og.png`);
      expect(await meta(page, 'property="og:image:alt"')).toBe('Rohan Jain, ML and AI Engineer');
      expect(await meta(page, 'name="twitter:card"')).toBe('summary_large_image');
      expect(await meta(page, 'name="twitter:image"')).toBe(`${ORIGIN}/og.png`);
    }
  });
}

test('the 404 page has no canonical and no social tags, and is noindex', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('head meta[property^="og:"]')).toHaveCount(0);
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('sitemap.xml lists only the home and privacy pages', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.ok()).toBe(true);
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toEqual([`${ORIGIN}/`, `${ORIGIN}/privacy/`]);
});

test('robots.txt allows all, blocks /for/ and /print/, names the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const lines = (await res.text()).split('\n');
  expect(lines).toContain('User-agent: *');
  expect(lines).toContain('Allow: /');
  expect(lines).toContain('Disallow: /for/');
  expect(lines).toContain('Disallow: /print/');
  expect(lines).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
});

test('home carries one JSON-LD Person block built from the site content', async ({ page }) => {
  await page.goto('/');
  const blocks = page.locator('script[type="application/ld+json"]');
  await expect(blocks).toHaveCount(1);
  const person = JSON.parse((await blocks.textContent()) ?? '{}');
  const site = JSON.parse(readFileSync('src/content/site.json', 'utf8'));
  expect(person['@type']).toBe('Person');
  expect(person.name).toBe(site.name);
  expect(person.email).toBe(site.email);
  expect(person.sameAs).toEqual(Object.values(site.profiles));
  expect(person.url).toBe(ORIGIN);
});

test('only the home page has JSON-LD', async ({ page }) => {
  for (const path of ['/privacy/', '/404.html']) {
    await page.goto(path);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  }
});
