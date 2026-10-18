// Security headers test (R-505, issue #29). Runs against the local preview with header emulation
// (scripts/preview.mjs, issue #17), not Astro's own preview, so the headers under test are the ones
// Cloudflare Pages will send. Expectations live in headers-checks.ts and come from docs/spec/08-security.md 8.2.
//
// HEADERS_TEST_DIR points the test at another build directory (default: dist). The self-test uses it
// to show that a mutated build fails.
import { spawn, type ChildProcess } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  COMMON_HEADERS,
  ROUTES,
  checkCsp,
  checkRouteHeaders,
  findInlineCode,
  scanTags,
  type HeaderMap,
} from './headers-checks';

const dist = resolve(process.env['HEADERS_TEST_DIR'] ?? 'dist');

let server: ChildProcess | undefined;
let origin = '';

function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const probe = createServer();
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => ok(port));
    });
  });
}

test.beforeAll(async () => {
  expect(
    statSync(dist, { throwIfNoEntry: false })?.isDirectory(),
    `${dist} not found. Run "npm run build" first.`,
  ).toBe(true);
  const port = await freePort();
  server = spawn(process.execPath, ['scripts/preview.mjs', '--port', String(port), '--dir', dist], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise<void>((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('preview did not start in 15 s')), 15_000);
    server?.once('exit', (code) => fail(new Error(`preview exited early with code ${code}`)));
    server?.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes(`http://localhost:${port}/`)) {
        clearTimeout(timer);
        ok();
      }
    });
  });
  origin = `http://localhost:${port}`;
});

test.afterAll(() => {
  server?.removeAllListeners('exit');
  server?.kill();
});

test.describe('security headers by route (8.2)', () => {
  for (const { path, kind } of ROUTES) {
    test(`${path} (${kind})`, async ({ request }) => {
      const res = await request.get(origin + path, { maxRedirects: 0 });
      expect(checkRouteHeaders(kind, res.headers())).toEqual([]);
    });
  }

  test('the stylesheet and a font carry the common headers and the CSP', async ({ request }) => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    const links = [...scanTags(html)].filter((t) => t.name === 'link');
    const css = links.find((t) => t.attrs.get('rel') === 'stylesheet')?.attrs.get('href');
    const font = links.find((t) => t.attrs.get('as') === 'font')?.attrs.get('href');
    expect(css, 'home page links a stylesheet').toBeTruthy();
    expect(font, 'home page preloads a font').toBeTruthy();
    for (const href of [css, font]) {
      const res = await request.get(origin + (href ?? ''));
      expect(res.status(), href).toBe(200);
      const headers = res.headers();
      expect(checkCsp(headers['content-security-policy']), href).toEqual([]);
      for (const [name, want] of Object.entries(COMMON_HEADERS))
        expect(headers[name], `${href} ${name}`).toBe(want);
    }
  });

  test('the home page is not served noindex and is not no-store', async ({ request }) => {
    const headers: HeaderMap = (await request.get(`${origin}/`)).headers();
    expect(headers['x-robots-tag']).toBeUndefined();
    expect(headers['cache-control'] ?? '').not.toContain('no-store');
  });
});

test.describe('CSP in a real browser', () => {
  test('the home page logs no CSP violation and no console error', async ({ page }) => {
    const seen: string[] = [];
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP violation event: ${e.violatedDirective} blocked ${e.blockedURI}`);
      });
    });
    page.on('console', (msg) => {
      if (
        msg.type() === 'error' ||
        msg.type() === 'warning' ||
        /content security policy|refused to/i.test(msg.text())
      ) {
        seen.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => seen.push(`pageerror: ${err.message}`));
    const res = await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);
    expect(checkCsp(res?.headers()['content-security-policy'])).toEqual([]);
    expect(seen).toEqual([]);
  });

  test('detector check: an injected inline script is blocked and reported', async ({ page }) => {
    // Proves the CSP is enforced by the browser and that the listener above would catch a violation.
    // require-trusted-types-for 'script' makes a raw string assignment throw before CSP is consulted, so
    // the script text goes through a pass-through Trusted Types policy (the CSP has no trusted-types
    // directive, so the browser allows creating one). That leaves script-src as the thing under test.
    const seen: string[] = [];
    page.on('console', (msg) => seen.push(msg.text()));
    await page.goto(`${origin}/`);
    const policyAvailable = await page.evaluate(() => {
      // The DOM lib in this repo has no Trusted Types typings, so describe the part used here.
      const tt = (
        window as unknown as {
          trustedTypes?: {
            createPolicy(
              name: string,
              rules: { createScript(text: string): string },
            ): { createScript(text: string): string };
          };
        }
      ).trustedTypes;
      if (!tt) return false;
      document.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP violation event: ${e.violatedDirective}`);
      });
      const policy = tt.createPolicy('qa-detector', { createScript: (text) => text });
      const s = document.createElement('script');
      s.textContent = policy.createScript('window.__inlineRan = true');
      document.head.append(s);
      return true;
    });
    expect(policyAvailable, 'the browser must support Trusted Types for this check').toBe(true);
    await expect.poll(() => seen.join('\n')).toMatch(/CSP violation event: script-src/i);
    expect(
      await page.evaluate(() => (window as unknown as { __inlineRan?: boolean }).__inlineRan),
    ).toBeUndefined();
  });

  test('Trusted Types: assigning a raw string to a script is rejected', async ({ page }) => {
    // require-trusted-types-for 'script' turns DOM XSS sinks into TypeErrors.
    await page.goto(`${origin}/`);
    const outcome = await page.evaluate(() => {
      const s = document.createElement('script');
      try {
        s.textContent = 'window.__rawRan = true';
        document.head.append(s);
        return { threw: false, message: '' };
      } catch (err) {
        return { threw: true, message: String((err as Error).message) };
      }
    });
    expect(outcome.threw).toBe(true);
    expect(outcome.message).toMatch(/TrustedScript/);
    expect(
      await page.evaluate(() => (window as unknown as { __rawRan?: boolean }).__rawRan),
    ).toBeUndefined();
  });
});

test.describe('build output has no inline code (ADR-0015 item 5)', () => {
  function htmlFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(full);
      return entry.name.endsWith('.html') ? [full] : [];
    });
  }

  test('dist/ has HTML to scan', () => {
    expect(htmlFiles(dist).length).toBeGreaterThan(0);
  });

  test('no inline script (JSON-LD excepted), inline style, style attribute or event handler', () => {
    const problems = htmlFiles(dist).flatMap((file) =>
      findInlineCode(readFileSync(file, 'utf8')).map((p) => `${file.slice(dist.length)}: ${p}`),
    );
    expect(problems).toEqual([]);
  });

  test('dist/_headers is present, so the deploy artifact carries the headers', () => {
    expect(statSync(join(dist, '_headers'), { throwIfNoEntry: false })?.isFile()).toBe(true);
  });
});
