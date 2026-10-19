// Cloudflare Email Address Obfuscation must leave the address alone (issue #293). Cloudflare documents the
// <!--email_off--> ... <!--/email_off--> comment markers for this:
// https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
// These tests read the BUILT html, because the build must keep the comments and a plain mailto link.
import { readFileSync } from 'node:fs';
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

/** Text outside <script> and <head> that contains the address, apart from inside mailto hrefs. */
const addressUses = (html: string) => {
  const body = html
    .replace(/<head[\s\S]*?<\/head>/, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/g, '');
  return [...body.matchAll(new RegExp(escaped, 'g'))]
    .map((m) => m.index ?? 0)
    .map((at) => ({ at, body }));
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
    for (const u of uses) {
      const ctx = u.body.slice(Math.max(0, u.at - 60), u.at + 60);
      expect(wrapped(u.body, u.at), ctx).toBe(true);
    }
  });
}

test('home: the built html keeps a plain mailto link and no Cloudflare-encoded link', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).toContain(`href="mailto:${EMAIL}?subject=`);
  expect(html).not.toContain('/cdn-cgi/l/email-protection');
  expect(html).not.toContain('email-decode');
});

test('the phone number is plain text and a tel link, which Cloudflare does not rewrite', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  expect(html).toMatch(/<a [^>]*href="tel:\+1\d{10}"/);
  expect(html).toMatch(/\(\d{3}\) \d{3}-\d{4}/);
});
