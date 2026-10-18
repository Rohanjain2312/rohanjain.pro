// `npm run shots`: screenshots and visible text for the Reader Advocate, written to .shots/ (gitignored).
// Always rebuilds (about 2 s), serves dist/ through scripts/preview.mjs (real CSP) on a free port, checks
// that the server answering is its own, then writes for each page and width (390, 1280):
//   <page>-<width>.png       full page, every fold open
//   <page>-<width>-fold.png  above the fold only (390x844, 1280x800)
//   <page>-<width>.txt       rendered text of the body
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { chromium } from '@playwright/test';

const OUT = '.shots';
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'privacy', path: '/privacy/' },
  { name: '404', path: '/404.html' },
];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
];

const nonce = randomBytes(12).toString('hex');
const nonceFile = `dist/.shots-${nonce}.txt`;
let server = null;
let browser = null;

// Synchronous cleanup that also runs on uncaught errors and process.exit.
function cleanup() {
  server?.kill('SIGKILL');
  server = null;
  rmSync(nonceFile, { force: true });
}
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGPIPE']) {
  process.on(sig, () => process.exit(1));
}
// Piping to `head` closes stdout early; stop quietly and clean up.
process.stdout.on('error', () => process.exit(1));

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (s.address());
      s.close(() => resolve(port));
    });
  });
}

async function main() {
  console.log('shots: building');
  const r = spawnSync('npm', ['run', 'build'], { stdio: 'ignore' });
  if (r.status !== 0) {
    console.error('shots: build failed. Run "npm run build" to see why.');
    process.exit(r.status ?? 1);
  }

  const port = await freePort();
  const base = `http://localhost:${port}`;
  writeFileSync(nonceFile, nonce);
  server = spawn('node', ['scripts/preview.mjs', '--port', String(port), '--dir', 'dist'], {
    stdio: 'ignore',
  });
  let exited = false;
  server.on('exit', () => (exited = true));

  // Ready only when our own server (not another process on the port) returns this run's nonce.
  let ready = false;
  for (let i = 0; i < 100 && !ready; i++) {
    if (exited) throw new Error('preview server exited (port in use?)');
    try {
      const res = await fetch(`${base}/.shots-${nonce}.txt`);
      ready = res.ok && (await res.text()) === nonce;
      if (!ready && res.status !== 404) throw new Error(`another server answers on port ${port}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('another')) throw e;
    }
    if (!ready) await new Promise((res) => setTimeout(res, 100));
  }
  if (!ready || exited) throw new Error('preview server did not start');

  mkdirSync(OUT, { recursive: true });
  browser = await chromium.launch();
  for (const p of PAGES) {
    for (const viewport of VIEWPORTS) {
      const w = viewport.width;
      const page = await browser.newPage({ viewport });
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
      // Fold shot first, from the top, with the page in its opened state.
      await page.screenshot({ path: `${OUT}/${p.name}-${w}-fold.png` });
      await page.screenshot({ path: `${OUT}/${p.name}-${w}.png`, fullPage: true });
      const text = await page.evaluate(() => document.body.innerText);
      writeFileSync(`${OUT}/${p.name}-${w}.txt`, `${text.trim()}\n`);
      await page.close();
      console.log(`shots: ${OUT}/${p.name}-${w}{,-fold}.png and .txt`);
    }
  }
}

try {
  await main();
} catch (e) {
  console.error(`shots: ${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  cleanup();
}
