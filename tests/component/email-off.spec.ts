// Cloudflare Email Address Obfuscation must leave the address alone (issue #293). Cloudflare documents the
// <!--email_off--> ... <!--/email_off--> comment markers for this:
// https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
// These tests read the BUILT html, because the build must keep the comments and a plain mailto link.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const EMAIL = (JSON.parse(readFileSync('src/content/site.json', 'utf8')) as { email: string })
  .email;
const escaped = EMAIL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OPEN = '<!--email_off-->';
const CLOSE = '<!--/email_off-->';

/** Every `<a href="mailto:ADDRESS...">` in the html. */
const mailtoLinks = (html: string) =>
  [
    ...html.matchAll(new RegExp(`<a [^>]*href="mailto:${escaped}[?"][^>]*>[\\s\\S]*?</a>`, 'g')),
  ].map((m) => ({ text: m[0], at: m.index ?? 0 }));

/** True when `at` is inside an element named `tag` (case-insensitive; checks the last open and close tag before it). */
const inside = (lower: string, at: number, tag: string) =>
  Math.max(lower.lastIndexOf(`<${tag}>`, at), lower.lastIndexOf(`<${tag} `, at)) >
  lower.lastIndexOf(`</${tag}>`, at);

/** Every position of the address outside <head>, <script> and <noscript>. No markup is removed or rewritten. */
const addressUses = (html: string) => {
  const lower = html.toLowerCase();
  const uses: number[] = [];
  for (let at = html.indexOf(EMAIL); at !== -1; at = html.indexOf(EMAIL, at + 1)) {
    if (!['head', 'script', 'noscript'].some((t) => inside(lower, at, t))) uses.push(at);
  }
  return uses;
};

/** True when `at` sits between an open and its close marker. */
const wrapped = (html: string, at: number) => {
  const open = html.lastIndexOf(OPEN, at);
  const close = html.lastIndexOf(CLOSE, at);
  return open !== -1 && open > close && html.indexOf(CLOSE, at) !== -1;
};

const pages = [
  { name: 'home', file: 'dist/index.html', minLinks: 2 },
  { name: 'print résumé ml', file: 'dist/print/resume/ml/index.html', minLinks: 0 },
  { name: 'print résumé ai', file: 'dist/print/resume/ai/index.html', minLinks: 0 },
  { name: 'print résumé ds', file: 'dist/print/resume/ds/index.html', minLinks: 0 },
];

for (const p of pages) {
  test(`${p.name}: every use of the address is inside email_off markers`, () => {
    const html = readFileSync(p.file, 'utf8');
    expect(html).toContain(OPEN);
    // Plain mailto links stay plain, and each is wrapped.
    const links = mailtoLinks(html);
    expect(links.length).toBeGreaterThanOrEqual(p.minLinks);
    for (const l of links) expect(wrapped(html, l.at), l.text).toBe(true);
    // Visible text (résumé contact line, brief contact line) is wrapped too.
    const uses = addressUses(html);
    expect(uses.length).toBeGreaterThan(0);
    for (const at of uses) {
      expect(wrapped(html, at), html.slice(Math.max(0, at - 60), at + 60)).toBe(true);
    }
  });
}

test('home: the built html keeps a plain mailto link and no Cloudflare-encoded link', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).toContain(`href="mailto:${EMAIL}?subject=`);
  expect(html).not.toContain('/cdn-cgi/l/email-protection');
  expect(html).not.toContain('email-decode');
});

test('the home page has no tel link', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).not.toMatch(/href="tel:/);
});

/** Every html file under `dir`, found by walking the directory. */
const htmlFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? htmlFiles(join(dir, e.name))
      : e.name.endsWith('.html')
        ? [join(dir, e.name)]
        : [],
  );

/** Start and end of each marker pair, or an error text when the markers do not alternate open, close, open, close. */
const markerPairs = (html: string): { pairs: [number, number][]; error?: string } => {
  const pairs: [number, number][] = [];
  let open = -1;
  for (let at = html.indexOf('<!--'); at !== -1; at = html.indexOf('<!--', at + 1)) {
    if (html.startsWith(OPEN, at)) {
      if (open !== -1) return { pairs, error: `open marker at ${at} inside an open pair` };
      open = at;
    } else if (html.startsWith(CLOSE, at)) {
      if (open === -1) return { pairs, error: `close marker at ${at} with no open marker` };
      pairs.push([open, at]);
      open = -1;
    }
  }
  return open === -1 ? { pairs } : { pairs, error: `open marker at ${open} never closed` };
};

test('every built page: each mailto: sits inside a marker pair and the markers balance', () => {
  const files = htmlFiles('dist');
  expect(files.length).toBeGreaterThan(3);
  let mailtos = 0;
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const { pairs, error } = markerPairs(html);
    expect(error, file).toBeUndefined();
    expect(html.split(OPEN).length, `${file}: open and close counts`).toBe(
      html.split(CLOSE).length,
    );
    const lower = html.toLowerCase();
    for (let at = lower.indexOf('mailto:'); at !== -1; at = lower.indexOf('mailto:', at + 1)) {
      mailtos++;
      const ok = pairs.some(([a, b]) => a < at && at < b);
      expect(ok, `${file}: mailto at ${at}: ${html.slice(Math.max(0, at - 40), at + 60)}`).toBe(
        true,
      );
    }
  }
  // The home page alone has the hero, contact and forward links.
  expect(mailtos).toBeGreaterThanOrEqual(3);
});
