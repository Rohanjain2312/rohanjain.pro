// Self-test for the launch setup script (ADR-0032, issue #275). Uses a mocked fetch; nothing touches the network.
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  SetupError,
  ensureEnvironment,
  ghApiRun,
  ghCheck,
  ghSecretSet,
  SETUP_PERMISSIONS,
  buildLink,
  dnsPlan,
  parseArgs,
  promptHidden,
  recordKey,
  runSetup,
} from '../scripts/launch-setup.mjs';

const ACCOUNT = 'a'.repeat(32);
const ZONE = 'b'.repeat(32);
const SECRET = 'setup-token-SECRET-value';
const DEPLOY = 'deploy-token-SECRET-value';

// A fake `gh api`. `state` is what the GET of the environment and its policies answer; writes are recorded.
const MAIN_ENV = JSON.stringify({ deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } });
const policies = (list) => JSON.stringify({ total_count: list.length, branch_policies: list });
function fakeApi({ get, list = [{ id: 1, name: 'main', type: 'branch' }], put = 0, post = 0 } = {}) {
  const writes = [];
  let created = false;
  const api = (args, opts = {}) => {
    const write = args[0] === '-X';
    if (write) {
      writes.push({ args, input: opts.input });
      if (args[1] === 'PUT') created = put === 0;
      return { status: args[1] === 'PUT' ? put : post, stdout: '', stderr: 'gh: HTTP 422' };
    }
    if (args[0].endsWith('/deployment-branch-policies')) {
      return { status: 0, stdout: policies(created || !get ? list : []), stderr: '' };
    }
    if (get && !created) return { status: 1, stdout: '', stderr: 'gh: HTTP 404', ...get };
    return { status: 0, stdout: MAIN_ENV, stderr: '' };
  };
  return { api, writes };
}

function mock({ zoneStatus = 'active', existing = [], failOn = null, groups, tokens = [] } = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    const path = url.replace('https://api.cloudflare.com/client/v4', '');
    const method = init.method;
    calls.push({ method, path, body: init.body ? JSON.parse(init.body) : null, auth: init.headers.Authorization });
    const ok = (result) => ({ ok: true, status: 200, json: async () => ({ success: true, result }) });
    if (failOn && path.includes(failOn)) {
      return { ok: false, status: 400, json: async () => ({ success: false, errors: [{ code: 1004, message: 'bad' }] }) };
    }
    if (path.startsWith('/zones?')) return ok([{ id: ZONE, status: zoneStatus }]);
    if (path.includes('/dns_records?')) return ok(existing);
    if (path.endsWith('/pages/projects')) return ok({ subdomain: 'rohanjain-pro.pages.dev' });
    if (path.endsWith('/dnssec')) return ok({ ds: 'rohanjain.pro. 3600 IN DS 1 13 2 ABCD' });
    if (path.endsWith('/rum/site_info')) return ok({ site_tag: 'tag123' });
    if (path.endsWith('/permission_groups')) return ok(groups ?? [{ id: 'g1', name: 'Pages Write' }, { id: 'g2', name: 'DNS Write' }]);
    if (method === 'GET' && path.endsWith(`/accounts/${ACCOUNT}/tokens`)) return ok(tokens);
    if (path.endsWith(`/accounts/${ACCOUNT}/tokens`)) return ok({ value: DEPLOY, id: 'tok123' });
    return ok({});
  };
  return { fetchFn, calls };
}

function run(opts = {}, mockOpts = {}) {
  const { fetchFn, calls } = mock(mockOpts);
  const logs = [];
  const secrets = [];
  const promise = runSetup({
    fetchFn,
    token: SECRET,
    accountId: ACCOUNT,
    log: (l) => logs.push(l),
    check: () => true,
    ghApi: fakeApi().api,
    setSecret: async (name, value, o) => secrets.push({ name, value, repo: o.repo }),
    now: () => new Date('2026-10-20T00:00:00Z'),
    ...opts,
  });
  return { promise, calls, logs, secrets };
}

test('link is a dash.cloudflare.com template with the five documented keys and no secrets', () => {
  const link = buildLink({ accountId: ACCOUNT, zoneId: ZONE });
  const url = new URL(link);
  assert.equal(url.origin + url.pathname, 'https://dash.cloudflare.com/profile/api-tokens');
  assert.deepEqual(JSON.parse(url.searchParams.get('permissionGroupKeys')), SETUP_PERMISSIONS);
  assert.deepEqual(
    SETUP_PERMISSIONS.map((p) => p.key),
    ['dns', 'zone_settings', 'account_settings', 'account_api_tokens', 'page'],
  );
  assert.equal(url.searchParams.get('accountId'), ACCOUNT);
  assert.equal(url.searchParams.get('zoneId'), ZONE);
  assert.equal(url.searchParams.get('name'), 'rohanjain.pro setup');
});

test('dns plan has apex and www, null MX, SPF, DMARC and eight CAA records', () => {
  const plan = dnsPlan('rohanjain-pro.pages.dev');
  const keys = plan.map(recordKey);
  assert.ok(keys.includes('CNAME|rohanjain.pro|rohanjain-pro.pages.dev'));
  assert.ok(keys.includes('CNAME|www.rohanjain.pro|rohanjain.pro'));
  assert.ok(keys.includes('MX|rohanjain.pro|.'));
  assert.ok(keys.includes('TXT|rohanjain.pro|v=spf1 -all'));
  assert.ok(keys.includes('TXT|_dmarc.rohanjain.pro|v=DMARC1; p=reject; adkim=s; aspf=s'));
  assert.equal(plan.filter((r) => r.type === 'CAA').length, 8);
  assert.equal(plan.find((r) => r.type === 'MX').priority, 0);
});

test('apply sends every step in order, with the token only in the Authorization header', async () => {
  const { promise, calls, logs, secrets } = run();
  const { failures } = await promise;
  assert.deepEqual(failures, []);
  assert.equal(calls.filter((c) => c.path.endsWith('/dns_records') && c.method === 'POST').length, 5 + 8);
  assert.ok(calls.every((c) => c.auth === `Bearer ${SECRET}`));
  const settings = calls.filter((c) => c.path.includes('/settings/'));
  assert.deepEqual(
    settings.map((c) => [c.path.split('/').pop(), c.body.value]),
    [['always_use_https', 'on'], ['automatic_https_rewrites', 'on'], ['min_tls_version', '1.2']],
  );
  assert.deepEqual(calls.find((c) => c.path.endsWith('/dnssec')).body, { status: 'active' });
  assert.equal(calls.find((c) => c.path.endsWith('/rum/site_info')).body.zone_tag, ZONE);
  // Nothing sensitive in URLs, bodies of non-token calls, or logs.
  for (const c of calls) assert.ok(!c.path.includes(SECRET) && !c.path.includes(DEPLOY));
  for (const l of logs) assert.ok(!l.includes(SECRET) && !l.includes(DEPLOY));
  assert.deepEqual(
    secrets.map((s) => [s.name, s.value]),
    [['CLOUDFLARE_API_TOKEN', DEPLOY], ['CLOUDFLARE_ACCOUNT_ID', ACCOUNT]],
  );
  assert.ok(logs.some((l) => l.includes('DS record')));
});

test('deploy token is Pages edit only, one group, 90 days, on the one account', async () => {
  const { promise, calls } = run();
  await promise;
  const create = calls.find((c) => c.method === 'POST' && c.path === `/accounts/${ACCOUNT}/tokens`);
  assert.equal(create.body.policies.length, 1);
  assert.deepEqual(create.body.policies[0].permission_groups, [{ id: 'g1' }]);
  assert.deepEqual(Object.keys(create.body.policies[0].resources), [`com.cloudflare.api.account.${ACCOUNT}`]);
  assert.equal(create.body.expires_on, '2027-01-18T00:00:00.000Z');
});

test('records that already exist are skipped, quoted TXT included', async () => {
  const existing = [
    { type: 'TXT', name: 'rohanjain.pro', content: '"v=spf1 -all"' },
    { type: 'CAA', name: 'rohanjain.pro', data: { flags: 0, tag: 'issue', value: 'letsencrypt.org' } },
  ];
  const { promise, calls } = run({}, { existing });
  await promise;
  assert.equal(calls.filter((c) => c.path.endsWith('/dns_records') && c.method === 'POST').length, 13 - 2);
});

test('a failed step is reported, later steps still run, secrets are not stored without a token', async () => {
  const { promise, calls, secrets } = run({}, { failOn: '/dnssec' });
  const { failures } = await promise;
  assert.equal(failures.length, 1);
  assert.match(failures[0], /dnssec/);
  assert.ok(calls.some((c) => c.path.endsWith('/rum/site_info')));
  assert.equal(secrets.length, 2);

  const missing = run({}, { groups: [{ id: 'g2', name: 'DNS Write' }] });
  const result = await missing.promise;
  assert.match(result.failures[0], /No permission group/);
  assert.equal(missing.secrets.length, 0);
});

test('an inactive zone stops before any change', async () => {
  const { promise, calls } = run({}, { zoneStatus: 'pending' });
  await assert.rejects(promise, /not active/);
  assert.equal(calls.length, 1);
});

test('dry run sends nothing and prints the calls without a token', async () => {
  let fetched = 0;
  const logs = [];
  const { failures } = await runSetup({
    fetchFn: async () => {
      fetched++;
    },
    token: undefined,
    accountId: ACCOUNT,
    dryRun: true,
    log: (l) => logs.push(l),
    setSecret: async () => {
      fetched++;
    },
  });
  assert.equal(fetched, 0);
  assert.deepEqual(failures, []);
  assert.ok(logs.filter((l) => l.startsWith('[dry-run] POST')).length >= 13);
  assert.ok(logs.some((l) => l.includes('gh secret set CLOUDFLARE_API_TOKEN --env production')));
  assert.ok(logs.every((l) => !/Bearer/.test(l)));
});

test('argument parsing', () => {
  assert.deepEqual(parseArgs(['--dry-run']), { dryRun: true, link: false });
  assert.equal(parseArgs(['--link', '--account', ACCOUNT, '--zone', ZONE]).zone, ZONE);
  assert.throws(() => parseArgs(['--token', 'x']), /Unexpected argument/);
});

test('the hidden prompt refuses a non-interactive stdin', async () => {
  await assert.rejects(promptHidden('Token', { input: { isTTY: false }, output: { write() {} } }), /interactive/);
});

test('error text never repeats input', () => {
  for (const bad of [
    ['--token=FAKE-SECRET'],
    ['FAKE-SECRET'],
    ['--account'],
    ['--account', 'FAKE-SECRET'],
    ['--zone', 'FAKE-SECRET'],
    ['--dry-run', '--account', 'FAKE-SECRET'],
    ['--repo', 'FAKE SECRET'],
  ]) {
    assert.throws(() => parseArgs(bad), (e) => !e.message.includes('FAKE') && e.message.length > 0);
  }
  assert.equal(parseArgs(['--dry-run', '--account', ACCOUNT]).account, ACCOUNT);
});

test('no request body, URL or log line contains the setup token, and dry-run output has no secret', async () => {
  const { promise, calls, logs } = run();
  await promise;
  for (const c of calls) assert.ok(!JSON.stringify(c.body ?? '').includes(SECRET) && !c.path.includes(SECRET));
  assert.ok(logs.every((l) => !l.includes(SECRET)));
  const dry = [];
  await runSetup({ token: SECRET, accountId: ACCOUNT, dryRun: true, log: (l) => dry.push(l), fetchFn: async () => {} });
  assert.ok(dry.every((l) => !l.includes(SECRET) && !l.includes(DEPLOY)));
});

test('only GET, POST and PATCH are ever sent: nothing is deleted', async () => {
  const { promise, calls } = run();
  await promise;
  assert.ok(calls.length > 20);
  assert.ok(calls.every((c) => ['GET', 'POST', 'PATCH'].includes(c.method)));
});

test('the deploy token request carries Pages edit only, nothing from the setup scope', async () => {
  const groups = [
    { id: 'dns', name: 'DNS Write' },
    { id: 'pages', name: 'Pages Write' },
    { id: 'zs', name: 'Zone Settings Write' },
    { id: 'tok', name: 'Account API Tokens Write' },
  ];
  const { promise, calls } = run({}, { groups });
  await promise;
  const posts = calls.filter((c) => c.method === 'POST' && c.path === `/accounts/${ACCOUNT}/tokens`);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].body.policies.length, 1);
  const [policy] = posts[0].body.policies;
  assert.equal(policy.effect, 'allow');
  assert.deepEqual(policy.permission_groups, [{ id: 'pages' }]);
  assert.deepEqual(policy.resources, { [`com.cloudflare.api.account.${ACCOUNT}`]: '*' });
});

test('an existing deploy token is not duplicated; its name and id are reported', async () => {
  const tokens = [{ name: 'rohanjain.pro pages deploy', id: 'old999', expires_on: '2027-01-01T00:00:00Z' }];
  const { promise, calls, secrets } = run({}, { tokens });
  const { failures } = await promise;
  assert.ok(!calls.some((c) => c.method === 'POST' && c.path === `/accounts/${ACCOUNT}/tokens`));
  assert.equal(secrets.length, 0);
  assert.match(failures[0], /already exists \(id old999/);
});

test('the new token name and id are printed, never its value', async () => {
  const { promise, logs } = run();
  await promise;
  assert.ok(logs.some((l) => l.includes('rohanjain.pro pages deploy') && l.includes('tok123')));
  assert.ok(logs.every((l) => !l.includes(DEPLOY)));
});

test('preflight stops before any Cloudflare call when gh or the environment is missing', async () => {
  for (const [label, check, pattern] of [
    ['no gh', () => false, /not installed/],
    ['no environment', () => true, /production environment/],
  ]) {
    const ghApi = label === 'no environment' ? fakeApi({ get: { status: 1, stderr: 'gh: HTTP 401' } }).api : undefined;
    const { promise, calls } = run({ check, ...(ghApi ? { ghApi } : {}) });
    await assert.rejects(promise, pattern, label);
    assert.equal(calls.length, 0, label);
  }
});

test('a failed secret store is reported in the summary with the token id', async () => {
  const { promise, logs } = run({
    setSecret: async () => {
      throw new SetupError('Could not store CLOUDFLARE_API_TOKEN: gh exited with 1');
    },
  });
  const { failures } = await promise;
  assert.match(failures.join(), /store secrets/);
  assert.ok(logs.some((l) => l.includes('tok123')));
  assert.ok(logs.at(-1).includes('failed step'));
});

function fakeGh(script) {
  const dir = mkdtempSync(join(tmpdir(), 'fakegh-'));
  writeFileSync(join(dir, 'gh'), script);
  chmodSync(join(dir, 'gh'), 0o755);
  return dir;
}

test('ghSecretSet: the value arrives on stdin only, not in argv or the environment', async () => {
  const dir = fakeGh(`#!/bin/sh
d="$(dirname "$0")"
printf '%s\\n' "$@" > "$d/argv"
env > "$d/env"
cat > "$d/stdin"
`);
  const oldPath = process.env.PATH;
  process.env.PATH = `${dir}:${oldPath}`;
  try {
    await ghSecretSet('CLOUDFLARE_API_TOKEN', DEPLOY, { repo: 'o/r' });
  } finally {
    process.env.PATH = oldPath;
  }
  const argv = readFileSync(join(dir, 'argv'), 'utf8').trim().split('\n');
  assert.deepEqual(argv, ['secret', 'set', 'CLOUDFLARE_API_TOKEN', '--env', 'production', '--repo', 'o/r']);
  assert.equal(readFileSync(join(dir, 'stdin'), 'utf8'), DEPLOY);
  assert.ok(!readFileSync(join(dir, 'env'), 'utf8').includes(DEPLOY));
});

test('ghSecretSet turns a missing gh and a bad exit into SetupError without the value', async () => {
  const oldPath = process.env.PATH;
  const safe = (e) => e instanceof SetupError && !e.message.includes(DEPLOY);
  process.env.PATH = mkdtempSync(join(tmpdir(), 'nogh-'));
  try {
    await assert.rejects(ghSecretSet('X', DEPLOY, { repo: 'o/r' }), safe);
  } finally {
    process.env.PATH = oldPath;
  }
  const dir = fakeGh('#!/bin/sh\nexit 3\n');
  process.env.PATH = `${dir}:${oldPath}`;
  try {
    await assert.rejects(ghSecretSet('X', DEPLOY, { repo: 'o/r' }), (e) => safe(e) && /exited with 3/.test(e.message));
  } finally {
    process.env.PATH = oldPath;
  }
});

test('ghCheck is false when gh cannot run', () => {
  const boom = () => {
    throw new Error('x');
  };
  assert.equal(ghCheck(['--version'], { spawnSyncFn: boom }), false);
  assert.equal(ghCheck(['--version'], { spawnSyncFn: () => ({ status: 0 }) }), true);
  assert.equal(ghCheck(['api', 'x'], { spawnSyncFn: () => ({ status: 1 }) }), false);
});

const envArgs = { repo: 'o/r', log: () => {}, dryRun: false };

test('environment: exists with main only, nothing is written', async () => {
  const f = fakeApi();
  await ensureEnvironment({ ...envArgs, ghApi: f.api });
  assert.deepEqual(f.writes, []);
});

test('environment: missing, so PUT then POST, with the documented bodies, then read back', async () => {
  const f = fakeApi({ get: {} });
  const logs = [];
  await ensureEnvironment({ ...envArgs, ghApi: f.api, log: (l) => logs.push(l) });
  assert.deepEqual(f.writes[0].args, ['-X', 'PUT', 'repos/o/r/environments/production', '--input', '-']);
  assert.deepEqual(JSON.parse(f.writes[0].input), {
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
  });
  assert.deepEqual(f.writes[1].args, [
    '-X',
    'POST',
    'repos/o/r/environments/production/deployment-branch-policies',
    '-f',
    'name=main',
    '-f',
    'type=branch',
  ]);
  assert.match(logs.join(), /created, main only/);
});

test('environment: another policy stops without writing', async () => {
  for (const list of [[{ name: 'dev', type: 'branch' }], [{ name: 'main', type: 'tag' }], [{ name: 'main', type: 'branch' }, { name: 'x', type: 'branch' }]]) {
    const f = fakeApi({ list });
    await assert.rejects(ensureEnvironment({ ...envArgs, ghApi: f.api }), /different deployment policy/);
    assert.deepEqual(f.writes, []);
  }
});

test('environment: custom policies on but none yet (earlier partial run) only adds main', async () => {
  const f = fakeApi({ list: [] });
  const api = (args, opts) => {
    const r = f.api(args, opts);
    return r;
  };
  let added = false;
  await ensureEnvironment({
    ...envArgs,
    ghApi: (args, opts) => {
      if (args[0] === '-X') added = true;
      if (args[0].endsWith('/deployment-branch-policies') && !args[0].startsWith('-')) {
        return { status: 0, stdout: policies(added ? [{ name: 'main', type: 'branch' }] : []), stderr: '' };
      }
      return api(args, opts);
    },
  });
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].args[1], 'POST');
});

test('environment: GitHub refusing the PUT stops with the fallback pointer', async () => {
  const f = fakeApi({ get: {}, put: 1 });
  await assert.rejects(ensureEnvironment({ ...envArgs, ghApi: f.api }), /unavailable for private repos[\s\S]*section 2/);
  assert.equal(f.writes.length, 1);
});

test('environment: unreadable (not signed in) stops without writing', async () => {
  const f = fakeApi({ get: { stderr: 'gh: HTTP 401' } });
  await assert.rejects(ensureEnvironment({ ...envArgs, ghApi: f.api }), /could not be read/);
  assert.deepEqual(f.writes, []);
});

test('environment: a refusal stops the whole run before any Cloudflare call', async () => {
  const f = fakeApi({ get: {}, put: 1 });
  const { promise, calls } = run({ ghApi: f.api });
  await assert.rejects(promise, /could not be created/);
  assert.equal(calls.length, 0);
});

test('environment: dry run prints both calls and runs nothing', async () => {
  const logs = [];
  await ensureEnvironment({ ...envArgs, dryRun: true, log: (l) => logs.push(l), ghApi: () => assert.fail('no gh call') });
  assert.ok(logs.some((l) => l.includes('-X PUT repos/o/r/environments/production')));
  assert.ok(logs.some((l) => l.includes('-X POST') && l.includes('name=main -f type=branch')));
});

test('ghApiRun never throws and returns the exit status', () => {
  const boom = () => {
    throw new Error('x');
  };
  assert.equal(ghApiRun(['a'], { spawnSyncFn: boom }).status, null);
  assert.equal(ghApiRun(['a'], { spawnSyncFn: () => ({ status: 0, stdout: 'ok' }) }).stdout, 'ok');
});
