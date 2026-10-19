// R-305, issue #249: the phone number is in no <head> of the three public pages (/, /privacy/, /404.html).
// Reads the built files, so it needs "npm run build" first. PHONE_TEST_DIR points it at another build directory
// (default: dist); the seeded-defect check uses it on a throwaway copy. The visible tel: link in the body is allowed.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { headHtml, lastTenDigits, phoneLeaks } from './phone-head-checks';

const dist = resolve(process.env['PHONE_TEST_DIR'] ?? 'dist');
const site = JSON.parse(readFileSync('src/content/site.json', 'utf8')) as { phone: string };
const PAGES = ['index.html', 'privacy/index.html', '404.html'] as const;

test.describe('the phone number is not in the head of a public page (R-305)', () => {
  test('site.json holds a phone number the check can use', () => {
    expect(lastTenDigits(site.phone)).toMatch(/^\d{10}$/);
  });

  for (const page of PAGES) {
    test(`${page}: the whole <head> holds no form of the number`, () => {
      const html = readFileSync(join(dist, page), 'utf8');
      const head = headHtml(html);
      expect(head, `${page} has a <head>`).toBeDefined();
      // The head must be real: a page whose head is empty would pass for the wrong reason.
      expect(head?.length ?? 0).toBeGreaterThan(200);
      expect(phoneLeaks(head ?? '', site.phone), page).toEqual([]);
    });
  }

  test('the home page still shows the number in the body, so the scan is not blind to it', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    const body = html.slice(html.toLowerCase().indexOf('</head'));
    expect(body.replace(/\D/g, '')).toContain(lastTenDigits(site.phone));
  });
});

test.describe('phone scan self-test (seeded defects)', () => {
  const phone = '(240) 495-9682';
  const head = (inner: string): string =>
    `<meta charset="utf-8"><title>Rohan Jain</title>${inner}<link rel="stylesheet" href="/_astro/a.css">`;
  const ld = (json: string): string => `<script type="application/ld+json">${json}</script>`;

  test('a clean head passes', () => {
    expect(phoneLeaks(head(ld('{"@type":"Person","name":"Rohan Jain"}')), phone)).toEqual([]);
  });

  test('the number in a nested contactPoint.telephone fails, in any formatting', () => {
    for (const tel of [
      '(240) 495-9682',
      '+1 240 495 9682',
      '+12404959682',
      '240.495.9682',
      '240-495-9682',
      '1 (240) 495-9682',
      '2404959682',
      '240 495 9682',
    ]) {
      const json = `{"@type":"Person","contactPoint":{"@type":"ContactPoint","telephone":"${tel}"}}`;
      expect(phoneLeaks(head(ld(json)), phone), tel).toHaveLength(1);
    }
  });

  test('the number in a meta tag, a data attribute or a link fails', () => {
    expect(phoneLeaks(head('<meta name="contact" content="240-495-9682">'), phone)).toHaveLength(1);
    expect(phoneLeaks(head('<meta name="x" content=\'(240) 495-9682\'>'), phone)).toHaveLength(1);
    expect(phoneLeaks(head('<link rel="me" href="tel:+12404959682">'), phone)).toHaveLength(1);
    expect(
      phoneLeaks(head('<meta name="x" data-tel="240 495 9682" content="y">'), phone),
    ).toHaveLength(1);
  });

  test('entity and JSON-escaped forms fail', () => {
    expect(
      phoneLeaks(head('<meta name="x" content="&#40;240&#41; 495-9682">'), phone),
    ).toHaveLength(1);
    expect(
      phoneLeaks(head('<meta name="x" content="&#x32;&#x34;&#x30;4959682">'), phone),
    ).toHaveLength(1);
    expect(phoneLeaks(head(ld('{"telephone":"\\u0032404959682"}')), phone)).toHaveLength(1);
  });

  test('only the last ten digits matter, so a different country code is still caught', () => {
    expect(phoneLeaks(head('<meta name="x" content="+44 240 495 9682">'), phone)).toHaveLength(1);
    expect(phoneLeaks(head('<meta name="x" content="+1 240 495 9683">'), phone)).toEqual([]);
    expect(lastTenDigits('+1 (240) 495-9682')).toBe('2404959682');
  });

  test('a text node in the head and a head spread over lines fail', () => {
    expect(phoneLeaks(head('<title>Call 240 495 9682</title>'), phone)).toHaveLength(1);
    expect(phoneLeaks(head('<meta\n  name="x"\n  content="240-495-9682"\n>'), phone)).toHaveLength(
      1,
    );
  });

  test('headHtml reads only the head, in any case', () => {
    const page =
      '<html><HEAD><title>a</title></HEAD><body><a href="tel:+12404959682">x</a></body></html>';
    expect(headHtml(page)).toBe('<title>a</title>');
    expect(phoneLeaks(headHtml(page) ?? '', phone)).toEqual([]);
    expect(headHtml('<html><body>no head</body></html>')).toBeUndefined();
  });

  test('a number that is too short is rejected, not silently accepted', () => {
    expect(() => lastTenDigits('495-9682')).toThrow(/at least 10/);
  });
});
