// `npm run shots`: screenshots and visible text for the Reader Advocate, written to .shots/ (gitignored).
// Builds if dist/ is missing or older than src/ and public/, serves dist/ through scripts/preview.mjs
// (real CSP), then writes <page>-<width>.png and <page>-<width>.txt for each page at 390 and 1280 px.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const PORT = 4323;
const OUT = '.shots';
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'privacy', path: '/privacy/' },
  { name: '404', path: '/404.html' },
];
const WIDTHS = [390, 1280];

function newest(dir) {
  let t = 0;
  if (!existsSync(dir)) return t;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newest(p) : statSync(p).mtimeMs);
  }
  return t;
}

const stamp = join('dist', 'index.html');
const stale =
  !existsSync(stamp) || Math.max(newest('src'), newest('public')) > statSync(stamp).mtimeMs;
if (stale) {
  console.log('shots: building');
  const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const server = spawn('node', ['scripts/preview.mjs', '--port', String(PORT), '--dir', 'dist'], {
  stdio: 'ignore',
});
const base = `http://localhost:${PORT}`;
let browser;
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${base}/`)).ok) break;
    } catch {
      /* not up yet */
    }
    if (i > 50) throw new Error('preview server did not start');
    await new Promise((r) => setTimeout(r, 100));
  }
  mkdirSync(OUT, { recursive: true });
  browser = await chromium.launch();
  for (const p of PAGES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(base + p.path);
      await page.evaluate(async () => {
        for (const d of document.querySelectorAll('details')) d.open = true;
        for (const img of document.querySelectorAll('img')) img.loading = 'eager';
        await document.fonts.ready;
        await Promise.all(
          Array.from(document.images).map((i) =>
            i.complete ? null : i.decode().catch(() => null),
          ),
        );
      });
      await page.screenshot({ path: `${OUT}/${p.name}-${width}.png`, fullPage: true });
      const text = await page.evaluate(() => document.body.innerText);
      writeFileSync(`${OUT}/${p.name}-${width}.txt`, `${text.trim()}\n`);
      await page.close();
      console.log(`shots: ${OUT}/${p.name}-${width}.{png,txt}`);
    }
  }
} finally {
  await browser?.close();
  server.kill();
}
