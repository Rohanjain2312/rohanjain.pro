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
  ['format check', 'npm', ['run', 'format:check']],
  ['eslint (R-401, R-405)', 'npm', ['run', 'lint']],
  ['stylelint (R-601, R-608)', 'npm', ['run', 'lint:css']],
  ['lint rule self-test', 'npm', ['run', 'lint:selftest']],
  ['hook tests (R-101, R-105, R-106, R-501)', 'npm', ['run', 'hooks:test']],
  ['ci gate self-tests (R-504, R-511, R-804)', 'npm', ['run', 'gates:test']],
  ['action pins (R-504)', 'node', ['.github/scripts/ci-checks.mjs', 'pins']],
  ['no tracked applications (R-501)', 'node', ['.github/scripts/ci-checks.mjs', 'applications']],
  ['hooks self-test (R-101, R-105, R-106, R-501)', 'node', ['.claude/hooks/test-hooks.mjs']],
  ['copy lint self-test', 'node', ['--test', 'tests/fixtures/copy/lint-copy.test.mjs']],
  ['content validation', 'npm', ['run', 'validate:content']],
  ['type check (N-08)', 'npm', ['run', 'check']],
  ['unit tests with coverage (R-703)', 'npm', ['run', 'test:coverage']],
  ['copy lint, source (R-007, R-008, R-010, R-601, R-603)', 'npm', ['run', 'lint:copy']],
  ['build (N-09)', 'npm', ['run', 'build']],
  ['copy lint, build output', 'npm', ['run', 'lint:copy', '--', '--require-dist']],
  ['html-validate', 'node', ['.github/scripts/html-validate.mjs']],
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
  console.error(
    '\nverify passed, but the working tree has uncommitted changes. Commit them and run verify again (R-110). No stamp written.',
  );
  process.exit(1);
}
const sha = git(['rev-parse', 'HEAD']).stdout.trim();
mkdirSync(stateDir, { recursive: true });
writeFileSync(stamp, sha + '\n');
console.log(`\nverify OK. Stamped ${sha}.`);
