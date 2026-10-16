// Self-test for scripts/phase-gate.mjs (#16) and .github/scripts/ci-checks.mjs (#13).
// Run: node --test .github/lint-fixtures/ci-gates.test.mjs
// Fixture directories are built inline in temp dirs, because tests/unit/ belongs to another role.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkGate } from '../../scripts/phase-gate.mjs';
import { checkPins } from '../scripts/ci-checks.mjs';

const SHA = 'a'.repeat(40);

function put(root, rel, text = 'x', mtime = null) {
  const p = join(root, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, text);
  if (mtime) utimesSync(p, mtime, mtime);
}

function gateRoot(phase) {
  const root = mkdtempSync(join(tmpdir(), 'gate-'));
  const old = new Date('2026-01-01T00:00:00Z');
  put(root, `.claude/rules/a.md`, 'x', old);
  for (const f of [`docs/phases/phase-${phase}-plan.md`, `docs/demos/phase-${phase}.md`, `docs/retros/phase-${phase}.md`, `docs/gates/phase-${phase}.md`, `docs/qa/review-audit-${phase}.md`]) put(root, f);
  if (phase === 1 || phase === 3) put(root, `docs/qa/audit-${phase}.md`);
  put(root, 'docs/qa/probe-results.md', 'x', new Date('2026-06-01T00:00:00Z'));
  return root;
}

function fixture(root, overrides = {}) {
  const f = join(root, 'gh.json');
  writeFileSync(
    f,
    JSON.stringify({
      issues: [{ number: 5, title: 'minor', labels: ['severity:low'] }],
      limit: { limit: 'collaborators_only', expires_at: '2099-01-01T00:00:00Z' },
      ...overrides,
    }),
  );
  return f;
}

const run = (phase, root, over) => checkGate({ phase, root, fixture: fixture(root, over) });

test('clean phase passes', () => {
  const root = gateRoot(2);
  assert.deepEqual(run(2, root), []);
  rmSync(root, { recursive: true });
});

for (const [rel, rule] of [
  ['docs/phases/phase-1-plan.md', 'R-804'],
  ['docs/demos/phase-1.md', 'R-804'],
  ['docs/retros/phase-1.md', 'R-804'],
  ['docs/gates/phase-1.md', 'R-804'],
  ['docs/qa/review-audit-1.md', 'R-206'],
  ['docs/qa/audit-1.md', 'R-704'],
  ['docs/qa/probe-results.md', 'R-807'],
]) {
  test(`missing ${rel} fails with ${rule}`, () => {
    const root = gateRoot(1);
    rmSync(join(root, rel));
    const out = run(1, root);
    assert.equal(out.length, 1);
    assert.match(out[0], new RegExp(`^${rule} missing ${rel}`));
    rmSync(root, { recursive: true });
  });
}

test('audit-N is not required for phase 2', () => {
  const root = gateRoot(2);
  assert.deepEqual(run(2, root), []);
  rmSync(root, { recursive: true });
});

test('probe results older than .claude/ change fail with R-807', () => {
  const root = gateRoot(2);
  put(root, '.claude/rules/b.md', 'x', new Date('2026-09-01T00:00:00Z'));
  const out = run(2, root);
  assert.match(out[0], /^R-807 .*older than the last \.claude\/ change/);
  rmSync(root, { recursive: true });
});

test('agent memory and state changes do not invalidate the probe', () => {
  const root = gateRoot(2);
  put(root, '.claude/agent-memory/x/m.md', 'x', new Date('2026-09-01T00:00:00Z'));
  put(root, '.claude/state/verify-ok', 'x', new Date('2026-09-01T00:00:00Z'));
  assert.deepEqual(run(2, root), []);
  rmSync(root, { recursive: true });
});

for (const label of ['severity:medium', 'severity:high', 'severity:critical']) {
  test(`open ${label} issue fails with R-511`, () => {
    const root = gateRoot(2);
    const out = run(2, root, { issues: [{ number: 9, title: 'bad', labels: [label] }] });
    assert.match(out[0], /^R-511 open issue #9/);
    rmSync(root, { recursive: true });
  });
}

test('interaction limit of another kind fails', () => {
  const root = gateRoot(2);
  const out = run(2, root, { limit: { limit: 'existing_users', expires_at: '2099-01-01T00:00:00Z' } });
  assert.match(out[0], /^ADR-0018 .*collaborators_only/);
  rmSync(root, { recursive: true });
});

test('interaction limit that expires before the next gate fails', () => {
  const root = gateRoot(2);
  const soon = new Date(Date.now() + 5 * 86400000).toISOString();
  const out = run(2, root, { limit: { limit: 'collaborators_only', expires_at: soon } });
  assert.match(out[0], /^ADR-0018 .*before the next planned gate/);
  rmSync(root, { recursive: true });
});

test('CLI exits 1 and prints the rule', () => {
  const root = gateRoot(2);
  rmSync(join(root, 'docs/retros/phase-2.md'));
  const r = spawnSync('node', ['scripts/phase-gate.mjs', '2', '--root', root, '--gh-fixture', fixture(root)], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R-804 missing docs\/retros\/phase-2\.md/);
  rmSync(root, { recursive: true });
});

test('CLI exits 2 without a phase number', () => {
  assert.equal(spawnSync('node', ['scripts/phase-gate.mjs'], { encoding: 'utf8' }).status, 2);
});

function wfRoot(workflow) {
  const root = mkdtempSync(join(tmpdir(), 'pins-'));
  put(root, '.github/workflows/w.yml', workflow);
  return root;
}

test('pins: pinned actions and read-all pass', () => {
  const root = wfRoot(`permissions: read-all\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@${SHA} # v1\n      - uses: ./.github/actions/setup\n`);
  assert.deepEqual(checkPins(root), []);
  rmSync(root, { recursive: true });
});

test('pins: tag ref fails with R-504', () => {
  const root = wfRoot(`permissions: read-all\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@v4\n`);
  const out = checkPins(root);
  assert.equal(out.length, 1);
  assert.match(out[0], /^R-504 .*:5 action is not pinned/);
  rmSync(root, { recursive: true });
});

test('pins: missing read-all fails with R-504', () => {
  const root = wfRoot(`jobs:\n  a:\n    steps:\n      - uses: actions/checkout@${SHA}\n`);
  assert.match(checkPins(root)[0], /^R-504 .*read-all/);
  rmSync(root, { recursive: true });
});

test('pins: unpinned action in a composite action fails', () => {
  const root = wfRoot('permissions: read-all\njobs: {}\n');
  put(root, '.github/actions/s/action.yml', `runs:\n  steps:\n    - uses: actions/setup-node@main\n`);
  assert.match(checkPins(root)[0], /^R-504 .*action.yml:3/);
  rmSync(root, { recursive: true });
});
