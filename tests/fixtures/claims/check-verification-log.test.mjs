// Self-test for the claims verification completeness check (issue #28, R-303).
// Run: node --test tests/fixtures/claims/check-verification-log.test.mjs
// The last group runs the check on the real claims.json and the real log, so the suite fails when
// a claim is added without a verification entry.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkLog, parseLog } from './check-verification-log.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'check-verification-log.mjs');
const repoRoot = join(here, '..', '..', '..');

const claims = [
  { id: 'alpha', value: 4 },
  { id: 'beta', value: '10+' },
  { id: 'gamma', value: 3.5 },
];

const HEADER = '| Claim ID | Value | Source checked | Result | Date |\n|---|---|---|---|---|\n';
const row = (id, value, source = 'resume line 3', result = 'verified', date = '2026-10-16') =>
  `| \`${id}\` | \`${value}\` | ${source} | ${result} | ${date} |\n`;
const goodLog = HEADER + row('alpha', '4') + row('beta', '10+') + row('gamma', '3.5');

test('a complete log has no errors and no warnings', () => {
  const r = checkLog(claims, goodLog);
  assert.deepEqual(r, { errors: [], warnings: [] });
});

test('a claim added without an entry fails and names the claim', () => {
  const more = [...claims, { id: 'delta', value: 1 }];
  const r = checkLog(more, goodLog);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /claim "delta" has no verification entry/);
});

test('every claim missing from an empty log is reported', () => {
  const r = checkLog(claims, HEADER);
  assert.equal(r.errors.length, 3);
});

test('an entry with no claim is reported as stale', () => {
  const r = checkLog(claims, goodLog + row('ghost', '1'));
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /entry "ghost" matches no claim/);
});

test('a duplicate entry is reported once', () => {
  const r = checkLog(claims, goodLog + row('alpha', '4'));
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /duplicate entry for claim "alpha"/);
});

test('a changed claim value invalidates the entry', () => {
  const r = checkLog([{ id: 'alpha', value: 5 }, claims[1], claims[2]], goodLog);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /value is `4` but claims.json has `5`/);
});

test('numeric and string values compare by their string form', () => {
  const r = checkLog([{ id: 'gamma', value: 3.5 }], HEADER + row('gamma', '3.5'));
  assert.deepEqual(r.errors, []);
});

test('an unknown result word is rejected', () => {
  const r = checkLog(claims, goodLog.replace('| verified |', '| fine |'));
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /result "fine" is not one of/);
});

test('a mismatch must cite an issue number', () => {
  const bare = checkLog(
    claims,
    HEADER + row('alpha', '4', 'x', 'mismatch') + row('beta', '10+') + row('gamma', '3.5'),
  );
  assert.match(bare.errors[0], /must cite its issue/);
  const cited = checkLog(
    claims,
    HEADER + row('alpha', '4', 'x', 'mismatch #12') + row('beta', '10+') + row('gamma', '3.5'),
  );
  assert.deepEqual(cited.errors, []);
  assert.equal(cited.warnings.length, 1);
});

test('extra text in the result cell is rejected', () => {
  const r = checkLog(claims, goodLog.replace('| verified |', '| verified mostly |'));
  assert.match(r.errors[0], /has extra text/);
});

test('an impossible or malformed date is rejected', () => {
  for (const bad of ['2026-02-30', '16 Oct 2026', '2026-13-01', '']) {
    const r = checkLog(
      claims,
      HEADER + row('alpha', '4', 'x', 'verified', bad) + row('beta', '10+') + row('gamma', '3.5'),
    );
    assert.equal(r.errors.length, 1, `date "${bad}"`);
    assert.match(r.errors[0], /is not a real YYYY-MM-DD date/);
  }
});

test('an empty source cell is rejected', () => {
  const r = checkLog(
    claims,
    HEADER + row('alpha', '4', '') + row('beta', '10+') + row('gamma', '3.5'),
  );
  assert.match(r.errors[0], /source checked is empty/);
});

test('a row with the wrong number of cells is rejected', () => {
  const r = checkLog(claims, goodLog + '| `alpha` | `4` | only three |\n');
  assert.ok(r.errors.some((e) => /expected 5 cells, found 3/.test(e)));
});

test('headings, prose and the table header are not entries', () => {
  const log = '# Title\n\nSome prose with | a pipe.\n\n' + goodLog + '\nClosing text.\n';
  const { entries, malformed } = parseLog(log);
  assert.equal(entries.length, 3);
  assert.equal(malformed.length, 0);
});

test('mismatch and unsourced entries warn by default and fail under require-clean', () => {
  const log =
    HEADER +
    row('alpha', '4', 'x', 'mismatch #9') +
    row('beta', '10+', 'x', 'unsourced') +
    row('gamma', '3.5');
  const lenient = checkLog(claims, log);
  assert.deepEqual(lenient.errors, []);
  assert.equal(lenient.warnings.length, 2);
  const strict = checkLog(claims, log, { requireClean: true });
  assert.equal(strict.errors.length, 2);
  assert.deepEqual(strict.warnings, []);
});

test('verified-note counts as clean', () => {
  const r = checkLog(claims, goodLog.replace('| verified |', '| verified-note |'), {
    requireClean: true,
  });
  assert.deepEqual(r.errors, []);
});

function runCli(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: repoRoot });
}

function tempFiles(claimsJson, log) {
  const dir = mkdtempSync(join(tmpdir(), 'claims-log-'));
  writeFileSync(join(dir, 'claims.json'), claimsJson);
  writeFileSync(join(dir, 'log.md'), log);
  return ['--claims', join(dir, 'claims.json'), '--log', join(dir, 'log.md')];
}

test('cli exits 0 on a complete log', () => {
  const r = runCli(tempFiles(JSON.stringify(claims), goodLog));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OK \(3 claims, 0 open finding/);
});

test('cli exits 1 with the rule id when a claim has no entry', () => {
  const more = JSON.stringify([...claims, { id: 'delta', value: 1 }]);
  const r = runCli(tempFiles(more, goodLog));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R-303 claim "delta" has no verification entry/);
});

test('cli exits 1 under --require-clean when a finding is open', () => {
  const log =
    HEADER + row('alpha', '4', 'x', 'unsourced') + row('beta', '10+') + row('gamma', '3.5');
  const files = tempFiles(JSON.stringify(claims), log);
  assert.equal(runCli(files).status, 0);
  assert.equal(runCli([...files, '--require-clean']).status, 1);
});

test('cli exits 2 on a missing file, bad JSON or an unknown flag', () => {
  assert.equal(runCli(['--claims', join(tmpdir(), 'no-such-claims.json')]).status, 2);
  assert.equal(runCli(tempFiles('{not json', goodLog)).status, 2);
  assert.equal(runCli(tempFiles('{}', goodLog)).status, 2);
  assert.equal(runCli(['--bogus']).status, 2);
});

test('the real log covers every claim in src/content/claims.json', () => {
  const r = runCli([
    '--claims',
    join(repoRoot, 'src/content/claims.json'),
    '--log',
    join(repoRoot, 'docs/qa/claims-verification.md'),
  ]);
  assert.equal(r.status, 0, r.stderr);
});
