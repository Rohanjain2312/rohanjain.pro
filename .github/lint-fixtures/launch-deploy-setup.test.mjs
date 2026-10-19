// Self-test for the deploy setup script (issue #284). A fake gh stands in for the real one; nothing leaves the machine.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SetupError } from '../scripts/launch-setup.mjs';
import { ghVariableSet, parseArgs, runDeploySetup } from '../scripts/launch-deploy-setup.mjs';

const TEMPLATE = 'name: Deploy production\n';
const b64 = (s) => Buffer.from(s).toString('base64').replace(/(.{60})/g, '$1\n');

// `file`: undefined = absent (404), string = existing content. `release`: whether the tag has a release.
function fake({ file, release = true, readStatus = 1, readErr = 'gh: HTTP 404', putStatus = 0 } = {}) {
  const writes = [];
  const vars = [];
  const ghApi = (args, opts = {}) => {
    if (args[0] === '-X') {
      writes.push({ args, input: opts.input });
      return { status: putStatus, stdout: '', stderr: 'gh: HTTP 422' };
    }
    if (args[0].includes('/releases/tags/')) return { status: release ? 0 : 1, stdout: '{}', stderr: 'gh: HTTP 404' };
    if (file !== undefined) return { status: 0, stdout: JSON.stringify({ content: b64(file) }), stderr: '' };
    return { status: readStatus, stdout: '', stderr: readErr };
  };
  const setVar = (name, value, o) => {
    vars.push([name, value, o.repo]);
    return true;
  };
  return { ghApi, setVar, writes, vars };
}

const run = (f, extra = {}) =>
  runDeploySetup({ template: TEMPLATE, log: () => {}, check: () => true, ghApi: f.ghApi, setVar: f.setVar, ...extra });

test('absent workflow: sets both variables, then adds the file with the template as base64', () => {
  const f = fake();
  const { changed } = run(f);
  assert.deepEqual(f.vars, [
    ['SITE_TAG', 'v0.9.1', 'Rohanjain2312/rohanjain.pro-applications'],
    ['CF_PAGES_PROJECT', 'rohanjain-pro', 'Rohanjain2312/rohanjain.pro-applications'],
  ]);
  assert.equal(f.writes.length, 1);
  assert.deepEqual(f.writes[0].args, [
    '-X',
    'PUT',
    'repos/Rohanjain2312/rohanjain.pro-applications/contents/.github/workflows/deploy.yml',
    '--input',
    '-',
  ]);
  const body = JSON.parse(f.writes[0].input);
  assert.equal(Buffer.from(body.content, 'base64').toString(), TEMPLATE);
  assert.ok(!('sha' in body));
  assert.ok(changed.includes('.github/workflows/deploy.yml'));
});

test('identical workflow: skipped, variables still set, no file write', () => {
  const f = fake({ file: TEMPLATE });
  const logs = [];
  run(f, { log: (l) => logs.push(l) });
  assert.equal(f.writes.length, 0);
  assert.equal(f.vars.length, 2);
  assert.ok(logs.some((l) => l.startsWith('skip (identical)')));
});

test('different workflow: stops with nothing changed', () => {
  const f = fake({ file: 'name: other\n' });
  assert.throws(() => run(f), /differs from the template/);
  assert.equal(f.writes.length, 0);
  assert.equal(f.vars.length, 0);
});

test('no published release for the tag: stops with nothing changed', () => {
  const f = fake({ release: false });
  assert.throws(() => run(f), /No published release v0\.9\.1/);
  assert.equal(f.vars.length + f.writes.length, 0);
});

test('unreadable repo (not signed in): stops with nothing changed', () => {
  const f = fake({ readErr: 'gh: HTTP 401' });
  assert.throws(() => run(f), /could not be read/);
  assert.equal(f.vars.length + f.writes.length, 0);
});

test('missing gh stops first', () => {
  const f = fake();
  assert.throws(() => run(f, { check: () => false }), /not installed/);
});

test('a refused file write is reported with the workflow-scope hint, after the variables', () => {
  const f = fake({ putStatus: 1 });
  assert.throws(() => run(f), /workflow scope/);
  assert.equal(f.vars.length, 2);
});

test('dry run prints the calls and runs nothing', () => {
  const logs = [];
  runDeploySetup({
    template: TEMPLATE,
    dryRun: true,
    log: (l) => logs.push(l),
    check: () => assert.fail('no gh'),
    ghApi: () => assert.fail('no gh'),
    setVar: () => assert.fail('no gh'),
  });
  assert.ok(logs.some((l) => l.includes('gh variable set SITE_TAG --body v0.9.1')));
  assert.ok(logs.some((l) => l.includes('gh variable set CF_PAGES_PROJECT --body rohanjain-pro')));
  assert.ok(logs.some((l) => l.includes('-X PUT') && l.includes('deploy.yml')));
});

test('ghVariableSet passes the documented arguments and reports failure', () => {
  let seen;
  assert.equal(ghVariableSet('A', 'b', { repo: 'o/r', spawnSyncFn: (c, a) => ((seen = [c, ...a]), { status: 0 }) }), true);
  assert.deepEqual(seen, ['gh', 'variable', 'set', 'A', '--body', 'b', '--repo', 'o/r']);
  assert.equal(ghVariableSet('A', 'b', { repo: 'o/r', spawnSyncFn: () => ({ status: 1 }) }), false);
  assert.equal(ghVariableSet('A', 'b', { repo: 'o/r', spawnSyncFn: () => { throw new Error('x'); } }), false);
});

test('arguments are validated and never echoed', () => {
  assert.deepEqual(parseArgs(['--dry-run', '--tag', 'v1.0.0']), { dryRun: true, tag: 'v1.0.0' });
  for (const bad of [['--tag', 'FAKE-SECRET'], ['--tag'], ['FAKE-SECRET'], ['--token=FAKE-SECRET'], ['--project', 'Bad Name FAKE']]) {
    assert.throws(() => parseArgs(bad), (e) => e instanceof SetupError && !e.message.includes('FAKE'));
  }
});
