#!/usr/bin/env node
// Runs html-validate over dist/. Passes trivially, and says so, while the build has no HTML pages (issue #21).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

const hasHtml = (dir) =>
  existsSync(dir) &&
  readdirSync(dir, { withFileTypes: true }).some((e) =>
    e.isDirectory() ? hasHtml(`${dir}/${e.name}`) : e.name.endsWith('.html'),
  );

if (!hasHtml('dist')) {
  console.log(
    'html-validate: dist has no HTML pages yet (pages land in issue #21). Passing trivially.',
  );
  process.exit(0);
}
const r = spawnSync(
  'npx',
  ['--no-install', 'html-validate', '-c', '.github/htmlvalidate.json', 'dist/**/*.html'],
  { stdio: 'inherit' },
);
process.exit(r.status ?? 1);
