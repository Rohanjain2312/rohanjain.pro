// Self-test for the header checks (issue #29 test plan): removing a header, changing a value or adding
// 'unsafe-inline' must produce a failure. No browser and no server needed.
import { expect, test } from '@playwright/test';
import {
  BEACON_URLS,
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
  for (const kind of ['home', 'for', 'print', 'notfound'] as const) {
    test(`a correct ${kind} response passes`, () => {
      expect(checkRouteHeaders(kind, good(kind))).toEqual([]);
    });
  }

  test('every route path maps to a kind', () => {
    expect(new Set(ROUTES.map((r) => r.kind))).toEqual(
      new Set(['home', 'for', 'print', 'notfound']),
    );
    expect(ROUTES.map((r) => r.path)).toEqual(expect.arrayContaining(['/for', '/print']));
  });

  for (const kind of ['home', 'for', 'print', 'notfound'] as const) {
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

  test('HSTS is required on every route kind, 404 included, and is typed from the spec', () => {
    const want = 'max-age=63072000; includeSubDomains; preload';
    expect(COMMON_HEADERS['strict-transport-security']).toBe(want);
    for (const kind of ['home', 'for', 'print', 'notfound'] as const) {
      expect(expectedHeaders(kind)['strict-transport-security'], kind).toBe(want);
      expect(checkRouteHeaders(kind, good(kind)), kind).toEqual([]);
    }
    expect(ROUTES.filter((r) => r.status === 404).map((r) => r.kind)).toEqual(
      expect.arrayContaining(['notfound', 'for']),
    );
  });

  test('a missing or weakened HSTS fails on every route kind', () => {
    for (const kind of ['home', 'for', 'print', 'notfound'] as const) {
      const missing = good(kind);
      delete missing['strict-transport-security'];
      expect(checkRouteHeaders(kind, missing), `${kind} missing`).not.toEqual([]);
      for (const weak of [
        'max-age=63072000; includeSubDomains',
        'max-age=63072000; preload',
        'max-age=300; includeSubDomains; preload',
        'max-age=31536000; includeSubDomains; preload',
        'max-age=63072000; includeSubDomains; preload; max-age=63072000; includeSubDomains; preload',
        '',
      ]) {
        const headers = { ...good(kind), 'strict-transport-security': weak };
        expect(checkRouteHeaders(kind, headers), `${kind} "${weak}"`).not.toEqual([]);
      }
    }
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

  test('script-src is typed from the spec: self plus the two exact beacon URLs', () => {
    expect([...(EXPECTED_CSP['script-src'] ?? [])]).toEqual([
      "'self'",
      'https://static.cloudflareinsights.com/beacon.min.js',
      'https://static.cloudflareinsights.com/beacon.min.js/',
    ]);
    expect(EXPECTED_CSP['connect-src']).toEqual(["'self'"]);
  });

  test('any extra script origin fails', () => {
    for (const extra of [
      'https://example.com',
      'https://example.com/a.js',
      'https://static.cloudflareinsights.com',
      'https://static.cloudflareinsights.com/',
      'https://static.cloudflareinsights.com/other.js',
      'https://static.cloudflareinsights.com/beacon.min.js/x',
      'https://static.cloudflareinsights.com/beacon.min.js?x=1',
      'http://static.cloudflareinsights.com/beacon.min.js',
      'https://cloudflareinsights.com/beacon.min.js',
      'https://static.cloudflareinsights.com:8443/beacon.min.js',
      'https://cdn.jsdelivr.net',
      'https:',
      'http:',
      'data:',
      'blob:',
      "'wasm-unsafe-eval'",
    ]) {
      const mutated = csp.replace("script-src 'self'", `script-src 'self' ${extra}`);
      expect(mutated, extra).not.toBe(csp);
      expect(checkCsp(mutated), extra).not.toEqual([]);
    }
  });

  test('a wildcard in script-src fails with a wildcard message', () => {
    for (const wild of [
      '*',
      '*.cloudflareinsights.com',
      'https://*.cloudflareinsights.com',
      'https://*.cloudflareinsights.com/beacon.min.js',
      'https://*',
    ]) {
      const problems = checkCsp(csp.replace("script-src 'self'", `script-src 'self' ${wild}`));
      expect(problems.join('\n'), wild).toMatch(/script-src contains a wildcard/);
    }
    const swapped = csp.replace(BEACON_URLS[0] ?? '', 'https://*.cloudflareinsights.com');
    expect(swapped).not.toBe(csp);
    expect(checkCsp(swapped).join('\n')).toMatch(/script-src contains a wildcard/);
  });

  test('a missing beacon URL or a missing trailing-slash form fails', () => {
    for (const url of BEACON_URLS) {
      const mutated = csp.replace(` ${url};`, ';').replace(` ${url} `, ' ');
      expect(mutated, url).not.toBe(csp);
      expect(checkCsp(mutated), url).not.toEqual([]);
    }
    const bare = csp.replace(` ${BEACON_URLS[0]}`, '').replace(` ${BEACON_URLS[1]}`, '');
    expect(bare).toContain("script-src 'self';");
    expect(checkCsp(bare)).not.toEqual([]);
  });

  test('the beacon URL is not accepted in any other directive', () => {
    for (const directive of ['connect-src', 'default-src', 'img-src', 'frame-src', 'style-src']) {
      const mutated = csp.replace(`${directive} `, `${directive} ${BEACON_URLS[0]} `);
      expect(mutated, directive).not.toBe(csp);
      expect(checkCsp(mutated), directive).not.toEqual([]);
    }
  });

  test("adding 'unsafe-inline' to style-src fails", () => {
    expect(
      checkCsp(csp.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")),
    ).not.toEqual([]);
  });

  test('the word in a comment is not a source (headers.md: parse the value, do not grep the file)', () => {
    expect(checkCsp(csp)).toEqual([]);
    expect(parseCsp(csp).directives.get('script-src')).toEqual(["'self'", ...BEACON_URLS]);
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
