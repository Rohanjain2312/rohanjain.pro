// Security headers test (R-505, issue #29). Runs against the local preview with header emulation
// (scripts/preview.mjs, issue #17), not Astro's own preview, so the headers under test are the ones
// Cloudflare Pages will send. Expectations live in headers-checks.ts and come from docs/spec/08-security.md 8.2.
//
// HEADERS_TEST_DIR points the test at another build directory (default: dist). The self-test uses it
// to show that a mutated build fails.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
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
    const seen: string[] = [];
    page.on('console', (msg) => seen.push(msg.text()));
    await page.goto(`${origin}/`);
    await page.evaluate(() => {
      document.addEventListener('securitypolicyviolation', (e) => {
        console.error(`CSP violation event: ${e.violatedDirective}`);
      });
      const s = document.createElement('script');
      s.textContent = 'window.__inlineRan = true';
      document.head.append(s);
    });
    await expect
      .poll(() => seen.join('\n'))
      .toMatch(/content security policy|CSP violation event/i);
    expect(
      await page.evaluate(() => (window as unknown as { __inlineRan?: boolean }).__inlineRan),
    ).toBeUndefined();
  });
});

test.describe('build output has no inline code (ADR-0015 item 5)', () => {
  function builtFiles(dir: string, ext: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return builtFiles(full, ext);
      return entry.name.endsWith(ext) ? [full] : [];
    });
  }
  const scan = (ext: string): string[] =>
    builtFiles(dist, ext).flatMap((file) =>
      findInlineCode(readFileSync(file, 'utf8')).map((p) => `${file.slice(dist.length)}: ${p}`),
    );

  test('dist/ has HTML to scan', () => {
    expect(builtFiles(dist, '.html').length).toBeGreaterThan(0);
  });

  test('no inline script (JSON-LD excepted), inline style, style attribute or event handler', () => {
    expect(scan('.html')).toEqual([]);
  });

  test('built SVG files have no <style>, style attribute, script or handler (issue #249, 156-1)', () => {
    // The graph-paper tile ships as dist/_astro/*.svg. Under style-src 'self' an SVG loaded as a document
    // would run its own <style>, so the scan must read SVG as well as HTML.
    expect(builtFiles(dist, '.svg').length).toBeGreaterThan(0);
    expect(scan('.svg')).toEqual([]);
  });

  test('dist/_headers is present, so the deploy artifact carries the headers', () => {
    expect(statSync(join(dist, '_headers'), { throwIfNoEntry: false })?.isFile()).toBe(true);
  });

  test('the built print pages exist, so the /print rows below test real pages (issue #249, 156-3)', () => {
    const prints = builtFiles(join(dist, 'print'), '.html').map((f) => f.slice(dist.length));
    expect(prints.length).toBeGreaterThan(0);
  });
});

test.describe('real /print pages from the build (issue #249, 156-3)', () => {
  test('each built print page answers 200 with the print headers and has no inline code', async ({
    request,
  }) => {
    const files = readdirSync(join(dist, 'print'), { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('index.html'))
      .sort();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const path = `/print/${file.slice(0, -'index.html'.length)}`;
      for (const url of [path, path.replace(/\/$/, '')]) {
        const res = await request.get(origin + url, { maxRedirects: 0 });
        // A bare path may redirect to the slash form; the redirect must still carry the headers.
        expect([200, 301, 308], url).toContain(res.status());
        expect(checkRouteHeaders('print', res.headers()), url).toEqual([]);
      }
      const body = await (await request.get(origin + path)).text();
      expect(findInlineCode(body), path).toEqual([]);
    }
  });
});

test.describe('real /for page, built from a synthetic result (issue #249, 156-3)', () => {
  // No /for page exists in dist/ because result files live outside the repo (ADR-0016). This block makes
  // one with the real generator, builds it into a temp directory and serves it with the same preview.
  // Nothing is written inside the repo (R-501, R-502).
  let work = '';
  let forServer: ChildProcess | undefined;
  let forOrigin = '';
  let slug = '';

  test.beforeAll(async () => {
    test.setTimeout(240_000);
    work = mkdtempSync(join(tmpdir(), 'headers-for-'));
    const apps = join(work, 'applications');
    mkdirSync(apps);
    writeFileSync(
      join(work, 'posting.txt'),
      'We need an AI Engineer.\nPython, SQL, Docker and Kubernetes are required.\nLangGraph and retrieval augmented generation.\n',
    );
    const gen = spawnSync(
      process.execPath,
      [
        'scripts/for.ts',
        '--company',
        'Headers Fixture',
        '--role',
        'AI Engineer',
        '--jd',
        join(work, 'posting.txt'),
        '--out',
        apps,
      ],
      { encoding: 'utf8' },
    );
    expect(gen.status, gen.stderr).toBe(0);
    slug = readdirSync(apps)[0]?.replace(/\.json$/, '') ?? '';
    expect(slug).not.toBe('');
    const out = join(work, 'dist');
    const build = spawnSync('npx', ['--no-install', 'astro', 'build', '--outDir', out], {
      env: { ...process.env, APPLICATIONS_DIR: apps },
      encoding: 'utf8',
    });
    expect(build.status, build.stderr).toBe(0);
    const port = await freePort();
    forServer = spawn(
      process.execPath,
      ['scripts/preview.mjs', '--port', String(port), '--dir', out],
      {
        stdio: 'ignore',
      },
    );
    forOrigin = `http://localhost:${port}`;
    for (let i = 0; i < 50; i++) {
      try {
        if ((await fetch(`${forOrigin}/`)).ok) return;
      } catch {
        // not up yet
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error('preview did not start in 10 s');
  });

  test.afterAll(() => {
    forServer?.kill('SIGKILL');
    if (work) rmSync(work, { recursive: true, force: true });
  });

  test('the generated page answers 200 with the for headers, bare and with a slash', async ({
    request,
  }) => {
    for (const url of [`/for/${slug}/`, `/for/${slug}`]) {
      const res = await request.get(forOrigin + url, { maxRedirects: 0 });
      expect([200, 301, 308], url).toContain(res.status());
      expect(checkRouteHeaders('for', res.headers()), url).toEqual([]);
    }
    const res = await request.get(`${forOrigin}/for/${slug}/`);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('Headers Fixture');
  });

  test('the generated page has no inline code', async ({ request }) => {
    const html = await (await request.get(`${forOrigin}/for/${slug}/`)).text();
    expect(findInlineCode(html)).toEqual([]);
  });
});
