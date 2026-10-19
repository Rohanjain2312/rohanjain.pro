// Self-test for the launch setup script (ADR-0032, issue #275). Uses a mocked fetch; nothing touches the network.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
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

function mock({ zoneStatus = 'active', existing = [], failOn = null, groups } = {}) {
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
    if (path.endsWith(`/accounts/${ACCOUNT}/tokens`)) return ok({ value: DEPLOY });
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
  assert.equal(parseArgs(['--link', '--account', 'x', '--zone', 'y']).zone, 'y');
  assert.throws(() => parseArgs(['--token', 'x']), /Unknown argument/);
});

test('the hidden prompt refuses a non-interactive stdin', async () => {
  await assert.rejects(promptHidden('Token', { input: { isTTY: false }, output: { write() {} } }), /interactive/);
});
