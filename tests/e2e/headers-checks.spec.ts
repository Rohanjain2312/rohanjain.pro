// Self-test for the header checks (issue #29 test plan): removing a header, changing a value or adding
// 'unsafe-inline' must produce a failure. No browser and no server needed.
import { expect, test } from '@playwright/test';
import {
  COMMON_HEADERS,
  EXPECTED_CSP,
  ROUTES,
  checkCsp,
  checkRouteHeaders,
  expectedHeaders,
  decodeEntities,
  findInlineCode,
  isJavascriptUrl,
  parseCsp,
  type HeaderMap,
  type RouteKind,
} from './headers-checks';

const csp = Object.entries(EXPECTED_CSP)
  .map(([name, sources]) => [name, ...sources].join(' '))
  .join('; ');

function good(kind: RouteKind): HeaderMap {
  return { 'content-security-policy': csp, ...expectedHeaders(kind) };
}

test.describe('route headers', () => {
  for (const kind of ['home', 'for', 'print'] as const) {
    test(`a correct ${kind} response passes`, () => {
      expect(checkRouteHeaders(kind, good(kind))).toEqual([]);
    });
  }

  test('every route path maps to a kind', () => {
    expect(new Set(ROUTES.map((r) => r.kind))).toEqual(new Set(['home', 'for', 'print']));
    expect(ROUTES.map((r) => r.path)).toEqual(expect.arrayContaining(['/for', '/print']));
  });

  for (const kind of ['home', 'for', 'print'] as const) {
    for (const name of Object.keys(expectedHeaders(kind)).concat('content-security-policy')) {
      test(`${kind}: removing ${name} fails`, () => {
        const headers = good(kind);
        delete headers[name];
        expect(checkRouteHeaders(kind, headers)).not.toEqual([]);
      });
    }
  }

  test('changing a value fails', () => {
    expect(
      checkRouteHeaders('home', { ...good('home'), 'x-frame-options': 'SAMEORIGIN' }),
    ).not.toEqual([]);
    expect(checkRouteHeaders('for', { ...good('for'), 'cache-control': 'no-cache' })).not.toEqual(
      [],
    );
    expect(checkRouteHeaders('print', { ...good('print'), 'x-robots-tag': 'noindex' })).not.toEqual(
      [],
    );
  });

  test('a joined duplicate value fails', () => {
    expect(
      checkRouteHeaders('print', {
        ...good('print'),
        'x-robots-tag': 'noindex, nofollow, noindex, nofollow',
      }),
    ).not.toEqual([]);
  });

  test('a noindex on the home page fails', () => {
    expect(
      checkRouteHeaders('home', { ...good('home'), 'x-robots-tag': 'noindex, nofollow' }),
    ).not.toEqual([]);
  });

  test('HSTS is neither required nor rejected before Phase 7', () => {
    expect(checkRouteHeaders('home', good('home'))).toEqual([]);
    const withHsts = {
      ...good('home'),
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    };
    expect(checkRouteHeaders('home', withHsts)).toEqual([]);
    expect(Object.keys(COMMON_HEADERS)).not.toContain('strict-transport-security');
  });
});

test.describe('CSP', () => {
  test('the expected CSP passes', () => {
    expect(checkCsp(csp)).toEqual([]);
  });

  test('directive order and extra whitespace do not matter', () => {
    const shuffled = csp.split('; ').reverse().join(' ;   ');
    expect(checkCsp(shuffled)).toEqual([]);
  });

  for (const token of [
    "'unsafe-inline'",
    "'unsafe-eval'",
    "'sha256-abc='",
    "'nonce-abc'",
    "'strict-dynamic'",
    '*',
  ]) {
    test(`adding ${token} to script-src fails`, () => {
      expect(checkCsp(csp.replace("script-src 'self'", `script-src 'self' ${token}`))).not.toEqual(
        [],
      );
    });
  }

  test("adding 'unsafe-inline' to style-src fails", () => {
    expect(
      checkCsp(csp.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")),
    ).not.toEqual([]);
  });

  test('the word in a comment is not a source (headers.md: parse the value, do not grep the file)', () => {
    expect(checkCsp(csp)).toEqual([]);
    expect(parseCsp(csp).directives.get('script-src')).toEqual(["'self'"]);
  });

  test('a missing, extra, repeated or changed directive fails', () => {
    expect(checkCsp(csp.replace("; frame-ancestors 'none'", ''))).not.toEqual([]);
    expect(checkCsp(`${csp}; object-src 'none'`)).not.toEqual([]);
    expect(checkCsp(`${csp}; script-src 'self'`)).not.toEqual([]);
    expect(checkCsp(csp.replace("default-src 'none'", "default-src 'self'"))).not.toEqual([]);
    expect(checkCsp(csp.replace('https://*.hf.space', 'https:'))).not.toEqual([]);
    expect(checkCsp(csp.replace('; upgrade-insecure-requests', ''))).not.toEqual([]);
  });

  test('a missing CSP fails', () => {
    expect(checkCsp(undefined)).not.toEqual([]);
  });
});

test.describe('inline code scan', () => {
  const page = (body: string, head = ''): string =>
    `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;

  test('a page with external assets and JSON-LD passes', () => {
    const html = page(
      '<main><h1>Hi</h1></main><script src="/_astro/a.js"></script>',
      '<link rel="stylesheet" href="/_astro/a.css"><script type="application/ld+json">{"@type":"Person"}</script>',
    );
    expect(findInlineCode(html)).toEqual([]);
  });

  test('inline script fails', () => {
    expect(findInlineCode(page('<script>alert(1)</script>'))).toHaveLength(1);
    expect(findInlineCode(page('<script type="module">import "/a.js"</script>'))).toHaveLength(1);
  });

  test('inline style element fails, with any case or attributes', () => {
    expect(findInlineCode(page('', '<style>body{margin:0}</style>'))).toHaveLength(1);
    expect(findInlineCode(page('', '<STYLE media="print">a{}</STYLE>'))).toHaveLength(1);
  });

  test('style attribute fails, quoted or not', () => {
    expect(findInlineCode(page('<p style="color:red">x</p>'))).toHaveLength(1);
    expect(findInlineCode(page("<p style='color:red'>x</p>"))).toHaveLength(1);
    expect(findInlineCode(page('<p style=color:red>x</p>'))).toHaveLength(1);
    expect(findInlineCode(page('<svg><rect STYLE="fill:red"/></svg>'))).toHaveLength(1);
  });

  test('event handlers and javascript: URLs fail', () => {
    expect(findInlineCode(page('<button onclick="go()">x</button>'))).toHaveLength(1);
    expect(findInlineCode(page('<a href="javascript:go()">x</a>'))).toHaveLength(1);
  });

  test('javascript: URLs written with entities or hidden whitespace fail (issue #249, 156-2)', () => {
    for (const href of [
      'java&#9;script:go()',
      'java&#x09;script:go()',
      'java&Tab;script:go()',
      'java&NewLine;script:go()',
      '&#106;avascript:go()',
      '&#x6A;avascript:go()',
      'javascript&colon;go()',
      '&#32;javascript:go()',
      '&#1;javascript:go()',
      'JaVaScRiPt:go()',
      'java\tscript:go()',
      'java\nscript:go()',
    ]) {
      expect(findInlineCode(page(`<a href="${href}">x</a>`)), href).toHaveLength(1);
    }
  });

  test('a link that only mentions javascript is not a javascript: URL', () => {
    for (const href of [
      '/docs/javascript:intro',
      'https://example.com/?u=javascript:x',
      'javascripts:go()',
      'java script:go()',
      '&amp;javascript:go()',
      '&unknown;javascript:go()',
    ]) {
      expect(findInlineCode(page(`<a href="${href}">x</a>`)), href).toEqual([]);
    }
  });

  test('entity decoding handles numeric, hex and the named forms a URL scheme can hide in', () => {
    expect(decodeEntities('a&#9;b&#x41;&#66;&colon;&Tab;')).toBe('a\tbAB:\t');
    expect(decodeEntities('&#0;&#1114112;&#xD800;')).toBe('&#0;&#1114112;&#xD800;');
    expect(isJavascriptUrl('&#x6A;avascript:1')).toBe(true);
    expect(isJavascriptUrl('/x')).toBe(false);
  });

  test('inline code in an SVG document fails the same scan (issue #249, 156-1)', () => {
    const svg = (inner: string): string =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">${inner}</svg>`;
    expect(findInlineCode(svg('<path d="M0 0h8v8H0z" fill="#fff"/>'))).toEqual([]);
    expect(findInlineCode(svg('<style>path{fill:red}</style><path d="M0 0"/>'))).toHaveLength(1);
    expect(findInlineCode(svg('<path style="fill:red" d="M0 0"/>'))).toHaveLength(1);
    expect(findInlineCode(svg('<script>alert(1)</script>'))).toHaveLength(1);
    expect(findInlineCode(svg('<rect onload="go()"/>'))).toHaveLength(1);
    expect(findInlineCode(svg('<a xlink:href="java&#9;script:go()"><rect/></a>'))).toHaveLength(1);
  });

  test('a style attribute inside a tag attribute value or text is not double counted or missed', () => {
    expect(findInlineCode(page('<p data-note="style=x">text style="y"</p>'))).toEqual([]);
    expect(findInlineCode(page('<p title="a > b" style="x">t</p>'))).toHaveLength(1);
  });

  test('markup inside an HTML comment is ignored', () => {
    expect(findInlineCode(page('<!-- <style>a{}</style> -->'))).toEqual([]);
  });
});
