#!/usr/bin/env node
// Phase 7 launch setup (ADR-0032, docs/runbooks/launch.md sections 1.3, 5 and 6). No dependencies.
// Run from the client's Terminal with the setup token. The token is read from a hidden prompt only:
// never an argument, never an environment variable, never written to disk, never logged, never in a URL.
//
//   node .github/scripts/launch-setup.mjs --link --account <id> --zone <id>   print the token template link
//   node .github/scripts/launch-setup.mjs --dry-run [--account <id>]          print every API call, send nothing
//   node .github/scripts/launch-setup.mjs                                     apply everything
//
// Options: --project <name> (Pages project, default rohanjain-pro), --repo <owner/name>.
// Every step is safe to re-run: records that already exist are skipped. The script never deletes anything.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

export const DOMAIN = 'rohanjain.pro';
export const DEFAULT_PROJECT = 'rohanjain-pro';
export const DEFAULT_REPO = 'Rohanjain2312/rohanjain.pro-applications';
const API = 'https://api.cloudflare.com/client/v4';

// Keys from Cloudflare's token template reference (R-005); the source URL per key is in
// docs/runbooks/launch.md section 5. Types use the documented `edit` level.
export const SETUP_PERMISSIONS = [
  { key: 'dns', type: 'edit' },
  { key: 'zone_settings', type: 'edit' },
  { key: 'account_settings', type: 'edit' },
  { key: 'account_api_tokens', type: 'edit' },
  { key: 'page', type: 'edit' },
];

// Names the permission-groups endpoint may use for Pages edit (both appear in Cloudflare's permissions reference).
export const PAGES_GROUP_NAMES = ['Pages Write', 'Cloudflare Pages Edit'];

// Cloudflare "Certificate authorities" page: CAA record content per CA.
export const CAA_VALUES = [
  'pki.goog; cansignhttpexchanges=yes',
  'letsencrypt.org',
  'ssl.com',
  'sectigo.com',
];

export function buildLink({ accountId, zoneId }) {
  const keys = encodeURIComponent(JSON.stringify(SETUP_PERMISSIONS));
  const name = encodeURIComponent(`${DOMAIN} setup`);
  return (
    `https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=${keys}` +
    `&accountId=${encodeURIComponent(accountId)}&zoneId=${encodeURIComponent(zoneId)}&name=${name}`
  );
}

// The DNS plan from runbook section 6. `target` is the Pages hostname.
export function dnsPlan(target) {
  const records = [
    { type: 'CNAME', name: DOMAIN, content: target, proxied: true, ttl: 1 },
    { type: 'CNAME', name: `www.${DOMAIN}`, content: DOMAIN, proxied: true, ttl: 1 },
    { type: 'MX', name: DOMAIN, content: '.', priority: 0, ttl: 1 },
    { type: 'TXT', name: DOMAIN, content: 'v=spf1 -all', ttl: 1 },
    {
      type: 'TXT',
      name: `_dmarc.${DOMAIN}`,
      content: 'v=DMARC1; p=reject; adkim=s; aspf=s',
      ttl: 1,
    },
  ];
  for (const value of CAA_VALUES) {
    for (const tag of ['issue', 'issuewild']) {
      records.push({ type: 'CAA', name: DOMAIN, data: { flags: 0, tag, value }, ttl: 1 });
    }
  }
  return records;
}

const unquote = (s) => String(s ?? '').replace(/^"|"$/g, '');
export function recordKey(r) {
  const body = r.type === 'CAA' ? `${r.data?.tag}|${unquote(r.data?.value)}` : unquote(r.content);
  return `${r.type}|${String(r.name).toLowerCase()}|${body}`;
}

export class SetupError extends Error {}

// Sends nothing in dry-run. Returns the parsed `result`. The token goes only in the Authorization header.
export function makeClient({ fetchFn, token, dryRun, log }) {
  return async function call(method, path, body, dryResult) {
    const line = `${method} ${path}${body ? ` ${JSON.stringify(body)}` : ''}`;
    if (dryRun) {
      log(`[dry-run] ${line}`);
      return dryResult;
    }
    const res = await fetchFn(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      // handled below
    }
    if (!res.ok || !json?.success) {
      const msg =
        (json?.errors ?? []).map((e) => `${e.code}: ${e.message}`).join('; ') ||
        `HTTP ${res.status}`;
      throw new SetupError(`${method} ${path} failed: ${msg}`);
    }
    return json.result;
  };
}

// Pipes the value to `gh secret set` on stdin, so it is never an argument.
export function ghSecretSet(name, value, { repo, spawnFn = spawn } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnFn('gh', ['secret', 'set', name, '--env', 'production', '--repo', repo], {
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new SetupError(`gh secret set ${name} exited with ${code}`)),
    );
    child.stdin.end(value);
  });
}

export async function runSetup({
  fetchFn = fetch,
  token,
  accountId,
  project = DEFAULT_PROJECT,
  repo = DEFAULT_REPO,
  dryRun = false,
  log = console.log,
  setSecret = ghSecretSet,
  now = () => new Date(),
}) {
  const call = makeClient({ fetchFn, token, dryRun, log });
  const failures = [];
  const step = async (label, fn) => {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof SetupError)) throw err;
      failures.push(`${label}: ${err.message}`);
      log(`FAILED ${label}: ${err.message}`);
      return undefined;
    }
  };

  const zones = await call('GET', `/zones?name=${DOMAIN}&account.id=${accountId}`, null, [
    { id: '<zone_id>', status: 'active' },
  ]);
  const zone = zones?.[0];
  if (!zone) throw new SetupError(`Zone ${DOMAIN} not found in this account`);
  if (zone.status !== 'active')
    throw new SetupError(`Zone ${DOMAIN} is ${zone.status}, not active`);
  const zoneId = zone.id;

  // Pages project and custom domains. The project hostname is read from the response (field unverified).
  const created = await step('pages project', () =>
    call(
      'POST',
      `/accounts/${accountId}/pages/projects`,
      { name: project, production_branch: 'main' },
      { subdomain: `${project}.pages.dev` },
    ),
  );
  const target = created?.subdomain ?? `${project}.pages.dev`;
  for (const name of [DOMAIN, `www.${DOMAIN}`]) {
    await step(`pages domain ${name}`, () =>
      call('POST', `/accounts/${accountId}/pages/projects/${project}/domains`, { name }),
    );
  }

  const existing = await call('GET', `/zones/${zoneId}/dns_records?per_page=500`, null, []);
  const have = new Set((existing ?? []).map(recordKey));
  for (const record of dnsPlan(target)) {
    if (have.has(recordKey(record))) {
      log(`skip (exists) ${recordKey(record)}`);
      continue;
    }
    await step(`dns ${recordKey(record)}`, () =>
      call('POST', `/zones/${zoneId}/dns_records`, record),
    );
  }

  for (const [id, value] of [
    ['always_use_https', 'on'],
    ['automatic_https_rewrites', 'on'],
    ['min_tls_version', '1.2'],
  ]) {
    await step(`setting ${id}`, () => call('PATCH', `/zones/${zoneId}/settings/${id}`, { value }));
  }

  const dnssec = await step('dnssec', () =>
    call('PATCH', `/zones/${zoneId}/dnssec`, { status: 'active' }, { ds: '<ds record>' }),
  );
  if (dnssec?.ds) log(`DNSSEC DS record (give to the client for Porkbun): ${dnssec.ds}`);

  const rum = await step('web analytics', () =>
    call(
      'POST',
      `/accounts/${accountId}/rum/site_info`,
      { host: DOMAIN, zone_tag: zoneId, auto_install: true },
      { site_tag: '<site_tag>' },
    ),
  );
  if (rum?.site_tag) log(`Web Analytics site tag: ${rum.site_tag}`);

  // Deploy token: Pages edit only, 90 days. Fails closed if the permission group cannot be found.
  const deployToken = await step('deploy token', async () => {
    const groups = await call('GET', `/accounts/${accountId}/tokens/permission_groups`, null, [
      { id: '<pages_group_id>', name: PAGES_GROUP_NAMES[0] },
    ]);
    const group = (groups ?? []).find((g) => PAGES_GROUP_NAMES.includes(g.name));
    if (!group) throw new SetupError(`No permission group named ${PAGES_GROUP_NAMES.join(' or ')}`);
    const expires = new Date(now().getTime() + 90 * 86400000).toISOString();
    const result = await call(
      'POST',
      `/accounts/${accountId}/tokens`,
      {
        name: `${DOMAIN} pages deploy`,
        policies: [
          {
            effect: 'allow',
            permission_groups: [{ id: group.id }],
            resources: { [`com.cloudflare.api.account.${accountId}`]: '*' },
          },
        ],
        expires_on: expires,
      },
      { value: '<deploy token>' },
    );
    if (!result?.value) throw new SetupError('Token created but the response had no value');
    return result.value;
  });

  if (dryRun) {
    log(
      `[dry-run] gh secret set CLOUDFLARE_API_TOKEN --env production --repo ${repo} (value on stdin)`,
    );
    log(
      `[dry-run] gh secret set CLOUDFLARE_ACCOUNT_ID --env production --repo ${repo} (value on stdin)`,
    );
  } else if (deployToken) {
    await step('store secrets', async () => {
      await setSecret('CLOUDFLARE_API_TOKEN', deployToken, { repo });
      await setSecret('CLOUDFLARE_ACCOUNT_ID', accountId, { repo });
    });
  }

  log(failures.length ? `Done with ${failures.length} failed step(s). Re-run is safe.` : 'Done.');
  return { failures, zoneId };
}

// Hidden prompt: raw mode, no echo. Refuses a non-interactive stdin so the token never comes from a pipe or history.
export function promptHidden(label, { input = process.stdin, output = process.stderr } = {}) {
  return new Promise((resolve, reject) => {
    if (!input.isTTY)
      return reject(new SetupError('Run this in an interactive Terminal. Input is hidden.'));
    output.write(`${label}: `);
    let value = '';
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          input.setRawMode(false);
          input.pause();
          input.off('data', onData);
          output.write('\n');
          return resolve(value.trim());
        }
        if (ch === '\u0003') {
          input.setRawMode(false);
          output.write('\n');
          return reject(new SetupError('Cancelled'));
        }
        if (ch === '\u007f') value = value.slice(0, -1);
        else value += ch;
      }
    };
    input.on('data', onData);
  });
}

function promptLine(label) {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) =>
    rl.question(`${label}: `, (a) => {
      rl.close();
      resolve(a.trim());
    }),
  );
}

export function parseArgs(argv) {
  const out = { dryRun: false, link: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--link') out.link = true;
    else if (['--account', '--zone', '--project', '--repo'].includes(a))
      out[a.slice(2)] = argv[++i];
    else throw new SetupError(`Unknown argument ${a}`);
  }
  return out;
}

const idPattern = /^[0-9a-f]{32}$/;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.link) {
    if (!idPattern.test(args.account ?? '') || !idPattern.test(args.zone ?? '')) {
      throw new SetupError(
        '--link needs --account and --zone (32 hex characters each, shown in the zone overview).',
      );
    }
    console.log(buildLink({ accountId: args.account, zoneId: args.zone }));
    return;
  }
  const accountId =
    args.account ?? (args.dryRun ? '<account_id>' : await promptLine('Cloudflare Account ID'));
  if (!args.dryRun && !idPattern.test(accountId))
    throw new SetupError('The Account ID is 32 hex characters.');
  const token = args.dryRun ? undefined : await promptHidden('Setup token (input hidden)');
  const { failures } = await runSetup({
    token,
    accountId,
    project: args.project,
    repo: args.repo,
    dryRun: args.dryRun,
  });
  if (failures.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof SetupError ? err.message : `Unexpected error: ${err.message}`);
    process.exit(1);
  });
}
