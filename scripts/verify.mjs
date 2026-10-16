#!/usr/bin/env node
// Runs every check CI runs, then stamps .claude/state/verify-ok with the HEAD SHA (R-110).
// The stamp is written only when all steps pass and the working tree is clean, so it always matches a real commit.
// Add a step here when a CI check is added (docs/spec/10-cicd.md).
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const stateDir = join(process.env.CLAUDE_PROJECT_DIR || cwd, '.claude', 'state');
const stamp = join(stateDir, 'verify-ok');

const steps = [
  ['docs lint (R-806)', 'npm', ['run', 'docs:lint']],
  ['type check (N-08)', 'npm', ['run', 'check']],
  ['unit tests (N-08)', 'npm', ['test']],
  ['build (N-09)', 'npm', ['run', 'build']],
  ['e2e tests', 'npm', ['run', 'test:e2e']],
];

function run(cmd, args) {
  return spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
}

rmSync(stamp, { force: true });

for (const [name, cmd, args] of steps) {
  console.log(`\n== verify: ${name}`);
  const r = run(cmd, args);
  if (r.status !== 0) {
    console.error(`\nverify FAILED at "${name}" (R-110). No stamp written.`);
    process.exit(r.status ?? 1);
  }
}

const git = (args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
const dirty = git(['status', '--porcelain']).stdout.trim();
if (dirty) {
  console.error('\nverify passed, but the working tree has uncommitted changes. Commit them and run verify again (R-110). No stamp written.');
  process.exit(1);
}
const sha = git(['rev-parse', 'HEAD']).stdout.trim();
mkdirSync(stateDir, { recursive: true });
writeFileSync(stamp, sha + '\n');
console.log(`\nverify OK. Stamped ${sha}.`);
