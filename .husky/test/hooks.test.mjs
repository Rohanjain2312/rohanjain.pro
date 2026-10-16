// Scripted tests: each hook blocks a bad case and allows a good one. Run with "npm run hooks:test".
// Test-only: every path below is built from mkdtemp directories, never from user input.
/* eslint-disable security/detect-non-literal-fs-filename */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const checks = join(root, '.husky/checks');
const commitlint = join(root, 'node_modules/.bin/commitlint');
const config = join(root, 'commitlint.config.mjs');

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'hooks-'));
  spawnSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}
function stage(dir, rel) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), 'x\n');
  spawnSync('git', ['add', '-f', rel], { cwd: dir });
}
function preCommit(dir, extraPath) {
  const path = [extraPath, '/usr/bin', '/bin', dirname(process.execPath)].filter(Boolean).join(':');
  return spawnSync(process.execPath, [join(checks, 'pre-commit.mjs')], {
    cwd: dir,
    encoding: 'utf8',
    env: { PATH: path, HOME: dir },
  });
}
function stub(name, code) {
  const d = mkdtempSync(join(tmpdir(), 'stub-'));
  writeFileSync(join(d, name), `#!/bin/sh\n${code}\n`);
  chmodSync(join(d, name), 0o755);
  return d;
}
function msg(text) {
  const file = join(mkdtempSync(join(tmpdir(), 'msg-')), 'MSG');
  writeFileSync(file, text);
  return spawnSync(commitlint, ['--config', config, '--edit', file], {
    cwd: root,
    encoding: 'utf8',
  });
}
function prePush(stdin) {
  return spawnSync(process.execPath, [join(checks, 'pre-push.mjs')], {
    input: stdin,
    encoding: 'utf8',
  });
}

test('pre-commit blocks postings/ (R-501)', () => {
  const d = repo();
  stage(d, 'postings/acme.txt');
  const r = preCommit(d);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R-501/);
});
test('pre-commit blocks *.jd.txt (R-501)', () => {
  const d = repo();
  stage(d, 'notes/acme.jd.txt');
  assert.equal(preCommit(d).status, 1);
});
test('pre-commit allows ordinary files and notes that gitleaks is missing', () => {
  const d = repo();
  stage(d, 'src/a.ts');
  const r = preCommit(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /gitleaks is not on PATH/);
});
test('pre-commit blocks when gitleaks reports a finding', () => {
  const d = repo();
  stage(d, 'src/a.ts');
  const r = preCommit(d, stub('gitleaks', '[ "$1" = version ] && exit 0; exit 1'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /gitleaks found/);
});
test('pre-commit passes when gitleaks is clean', () => {
  const d = repo();
  stage(d, 'src/a.ts');
  assert.equal(preCommit(d, stub('gitleaks', 'exit 0')).status, 0);
});

const good =
  'feat(hooks): add git hooks (#12)\n\nBody.\n\nAgent-Role: platform-engineer\nCo-Authored-By: Claude <noreply@anthropic.com>\n';
test('commit-msg allows a good message', () => {
  const r = msg(good);
  assert.equal(r.status, 0, r.stdout);
});
test('commit-msg allows the history format with role prefix and PR number', () => {
  const r = msg(
    '[supervisor] fix(hooks): let subagents end (#104) (#106)\n\nAgent-Role: supervisor\n',
  );
  assert.equal(r.status, 0, r.stdout);
});
test('commit-msg blocks a non-conventional header', () => {
  assert.notEqual(msg('added stuff (#12)\n\nAgent-Role: platform-engineer\n').status, 0);
});
test('commit-msg blocks a missing issue number (R-105)', () => {
  const r = msg('feat(hooks): add git hooks\n\nAgent-Role: platform-engineer\n');
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /R-105/);
});
test('commit-msg blocks a missing Agent-Role trailer (R-106)', () => {
  const r = msg('feat(hooks): add git hooks (#12)\n\nBody.\n');
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /R-106/);
});
test('commit-msg blocks an unknown role (R-106)', () => {
  assert.notEqual(msg('feat(hooks): add (#12)\n\nAgent-Role: intern\n').status, 0);
});

test('pre-push blocks main (R-101)', () => {
  const r = prePush('refs/heads/x abc refs/heads/main def\n');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R-101/);
});
test('pre-push allows a branch', () => {
  assert.equal(prePush('refs/heads/x abc refs/heads/platform/12-git-hooks 000\n').status, 0);
});

test('hook files wire the checks and tools', () => {
  const h = (n) => readFileSync(join(root, '.husky', n), 'utf8');
  assert.match(h('pre-commit'), /pre-commit\.mjs[\s\S]*lint-staged/);
  assert.match(h('commit-msg'), /commitlint --edit "\$1"/);
  assert.match(h('pre-push'), /pre-push\.mjs/);
});
