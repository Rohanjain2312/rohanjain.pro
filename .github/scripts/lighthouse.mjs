#!/usr/bin/env node
// Lighthouse budgets (R-607, docs/spec/09-quality.md 9.3). Run `npm run lighthouse` (builds first).
// Serves dist/ with gzip through scripts/preview.mjs, runs mobile Lighthouse (the default profile) on each page in
// .github/lighthouse-budgets.json with the Chromium that Playwright installed, and fails when the median of the runs misses a budget.
// Asserted: scores and LCP, CLS, TBT. Not asserted: the 9.3 size budgets (JS, CSS, fonts, images); see the runbook.
// Lighthouse is a pinned exact devDependency. Nothing is fetched at run time.
// Usage: node .github/scripts/lighthouse.mjs [--runs 3] [--json out.json]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { isValidRun, median, minValidRuns } from './lighthouse-lib.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const runs = Number(opt('--runs', '3'));
if (!Number.isInteger(runs) || runs < 1 || runs % 2 === 0) {
  console.error('lighthouse: --runs must be an odd number (1, 3, 5), so the median is a real run.');
  process.exit(2);
}
const jsonOut = opt('--json', '');
const budgets = JSON.parse(
  readFileSync(new URL('../lighthouse-budgets.json', import.meta.url), 'utf8'),
);

function freePort() {
  return new Promise((ok, fail) => {
    const probe = createServer();
    probe.once('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => ok(port));
    });
  });
}

async function startServer() {
  const port = await freePort();
  const child = spawn(
    process.execPath,
    ['scripts/preview.mjs', '--port', String(port), '--dir', 'dist', '--gzip'],
    {
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  await new Promise((ok, fail) => {
    const timer = setTimeout(() => fail(new Error('preview did not start in 15 s')), 15_000);
    child.once('exit', (code) => fail(new Error(`preview exited early with code ${code}`)));
    child.stdout.on('data', (d) => {
      if (String(d).includes('http://localhost')) {
        clearTimeout(timer);
        ok();
      }
    });
  });
  return { port, child };
}

const { port, child } = await startServer();
const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});
const failures = [];
const table = [];
try {
  for (const page of budgets.pages) {
    const categories = Object.keys(budgets.scores).filter((c) => !page.skip.includes(c));
    const rows = [];
    for (let i = 0; i < runs; i++) {
      let row = { path: page.path, run: i + 1, valid: false };
      try {
        const result = await lighthouse(
          `http://localhost:${port}${page.path}`,
          { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: categories },
          undefined,
        );
        const lhr = result?.lhr;
        const values = {};
        for (const c of categories) {
          const score = lhr?.categories?.[c]?.score;
          values[c] = typeof score === 'number' ? Math.round(score * 100) : Number.NaN;
        }
        for (const id of Object.keys(budgets.metrics)) {
          const v = lhr?.audits?.[id]?.numericValue;
          values[id] = typeof v === 'number' ? Math.round(v * 1000) / 1000 : Number.NaN;
        }
        row = { ...row, ...values, valid: isValidRun(lhr, values) };
        if (lhr?.runtimeError) row.error = lhr.runtimeError.code;
      } catch (error) {
        row.error = String(error?.message ?? error).slice(0, 120);
      }
      rows.push(row);
      console.log(JSON.stringify(row));
    }
    table.push(...rows);
    // Failed runs (a runtime error or a missing metric) are dropped, never averaged in.
    const good = rows.filter((r) => r.valid);
    if (good.length < minValidRuns(runs)) {
      failures.push(
        `${page.path}: only ${good.length} of ${runs} runs were valid, need ${minValidRuns(runs)}`,
      );
      continue;
    }
    // The budget applies to the median of the valid runs, as Lighthouse CI does.
    const mid = (key) => median(good.map((r) => r[key]));
    for (const c of categories) {
      if (!(mid(c) >= budgets.scores[c]))
        failures.push(`${page.path}: ${c} ${mid(c)}, budget ${budgets.scores[c]}+`);
    }
    for (const [id, max] of Object.entries(budgets.metrics)) {
      if (!(mid(id) < max)) failures.push(`${page.path}: ${id} ${mid(id)}, budget under ${max}`);
    }
  }
} finally {
  await chrome.kill();
  child.kill();
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(table, null, 2));
if (failures.length) {
  console.error(
    `\nR-607: Lighthouse budgets missed (docs/spec/09-quality.md 9.3):\n  ${failures.join('\n  ')}`,
  );
  process.exit(1);
}
console.log(`\nLighthouse budgets met on ${budgets.pages.length} pages, ${runs} run(s) each.`);
