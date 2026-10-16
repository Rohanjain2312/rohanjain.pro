#!/usr/bin/env node
// Repo policy checks run by ci.yml. Usage: node .github/scripts/ci-checks.mjs pins|applications [--root DIR]
//   pins          R-504  every `uses:` is pinned to a 40-char commit SHA; each workflow sets `permissions: read-all` at top level
//   applications  R-501  the repo tracks nothing under src/content/applications/ except .gitkeep (ADR-0016)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function checkPins(root) {
  const failures = [];
  const files = [];
  for (const dir of ['.github/workflows', '.github/actions']) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const d = stack.pop();
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (/\.ya?ml$/.test(e.name)) files.push(p);
      }
    }
  }
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    const rel = f.slice(root.length + 1);
    text.split('\n').forEach((line, i) => {
      const m = line.match(/^\s*-?\s*uses:\s*['"]?([^\s'"#]+)/);
      if (!m) return;
      const ref = m[1];
      if (ref.startsWith('./') || ref.startsWith('docker://')) return;
      if (!/@[0-9a-f]{40}$/.test(ref))
        failures.push(`R-504 ${rel}:${i + 1} action is not pinned to a full commit SHA: ${ref}`);
    });
    if (
      rel.split('\\').join('/').startsWith('.github/workflows/') &&
      !/^permissions:\s*read-all\s*$/m.test(text)
    ) {
      failures.push(`R-504 ${rel} must set "permissions: read-all" at workflow level`);
    }
  }
  return failures;
}

export function checkApplications(root) {
  const r = spawnSync('git', ['ls-files', '--', 'src/content/applications'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status !== 0) return [`R-501 could not list tracked files: ${r.stderr.trim()}`];
  return r.stdout
    .split('\n')
    .filter((f) => f && f !== 'src/content/applications/.gitkeep')
    .map(
      (f) =>
        `R-501 ${f} is tracked, but private application results must stay out of this repo (ADR-0016)`,
    );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, flag, dir] = process.argv.slice(2);
  const root = flag === '--root' ? dir : process.cwd();
  const fn = { pins: checkPins, applications: checkApplications }[cmd];
  if (!fn) {
    console.error('usage: ci-checks.mjs pins|applications [--root DIR]');
    process.exit(2);
  }
  const failures = fn(root);
  if (failures.length) {
    for (const f of failures) console.error(f);
    process.exit(1);
  }
  console.log(`${cmd} check OK`);
}
