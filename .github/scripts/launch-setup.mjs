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
import { spawn, spawnSync } from 'node:child_process';
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

export class SetupError extends Error {
  constructor(message, codes = []) {
    super(message);
    this.codes = codes;
  }
}

// Cloudflare error codes that mean "already there" (seen on a real re-run, issue #284): Pages project 8000002,
// Pages custom domain 8000018, Web Analytics site 10023. These steps are skipped, not failed.
export const ALREADY_EXISTS = { pagesProject: 8000002, pagesDomain: 8000018, webAnalytics: 10023 };

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
      throw new SetupError(
        `${method} ${path} failed: ${msg}`,
        (json?.errors ?? []).map((e) => e.code),
      );
    }
    return json.result;
  };
}

// Pipes the value to the gh command on stdin, so it is never an argument or an environment variable.
// Every failure (missing gh, closed pipe, non-zero exit) becomes a SetupError, so the summary still prints.
export function ghSecretSet(name, value, { repo, spawnFn = spawn } = {}) {
  return new Promise((resolve, reject) => {
    const fail = (why) => reject(new SetupError(`Could not store ${name}: ${why}`));
    let child;
    try {
      child = spawnFn('gh', ['secret', 'set', name, '--env', 'production', '--repo', repo], {
        stdio: ['pipe', 'inherit', 'inherit'],
      });
    } catch {
      return fail('gh could not be started');
    }
    child.on('error', () => fail('gh could not be started'));
    child.stdin.on('error', () => fail('gh closed its input'));
    child.on('close', (code) => (code === 0 ? resolve() : fail(`gh exited with ${code}`)));
    child.stdin.end(value);
  });
}

// Read-only gh check. Returns true when gh runs and exits 0. Output is discarded.
export function ghCheck(args, { spawnSyncFn = spawnSync } = {}) {
  try {
    return spawnSyncFn('gh', args, { stdio: 'ignore' }).status === 0;
  } catch {
    return false;
  }
}

// Runs `gh api` with an optional JSON body on stdin. Returns { status, stdout, stderr }. Never throws.
export function ghApiRun(args, { input, spawnSyncFn = spawnSync } = {}) {
  try {
    const r = spawnSyncFn('gh', ['api', ...args], { input, encoding: 'utf8' });
    return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  } catch {
    return { status: null, stdout: '', stderr: '' };
  }
}

// Creates the `production` environment limited to `main`, or confirms it already is. Calls and bodies are from
// docs.github.com/en/rest/deployments/environments and .../branch-policies (see docs/runbooks/launch.md section 2).
// The PUT runs only when the environment is absent: GitHub documents it as "create or update", so it is never sent for an existing one.
export async function ensureEnvironment({ repo, ghApi, log, dryRun }) {
  const base = `repos/${repo}/environments/production`;
  const putBody = JSON.stringify({
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
  });
  if (dryRun) {
    log(
      `[dry-run] gh api ${base} (read; created only if it answers HTTP 404, policy added if none yet)`,
    );
    log(`[dry-run] gh api -X PUT ${base} --input - ${putBody}`);
    log(`[dry-run] gh api -X POST ${base}/deployment-branch-policies -f name=main -f type=branch`);
    log(`[dry-run] gh api ${base}/deployment-branch-policies (read back)`);
    return;
  }
  // 'missing' | 'main' (custom policy with only main) | 'empty' (custom policies on, none added yet) | 'other' | 'unreadable'
  const state = () => {
    const env = ghApi([base]);
    if (env.status !== 0) return /HTTP 404/.test(env.stderr) ? 'missing' : 'unreadable';
    let policy;
    try {
      policy = JSON.parse(env.stdout).deployment_branch_policy;
    } catch {
      return 'other';
    }
    if (policy?.custom_branch_policies !== true || policy.protected_branches !== false)
      return 'other';
    const list = ghApi([`${base}/deployment-branch-policies`]);
    try {
      const bp = JSON.parse(list.stdout).branch_policies;
      if (list.status !== 0) return 'unreadable';
      if (bp.length === 0) return 'empty';
      return bp.length === 1 && bp[0].name === 'main' && bp[0].type === 'branch' ? 'main' : 'other';
    } catch {
      return 'unreadable';
    }
  };
  const stop = (why) =>
    new SetupError(
      `The production environment of ${repo} ${why} Nothing was changed in Cloudflare.`,
    );
  let now = state();
  if (now === 'main') return log('production environment exists, main only');
  if (now === 'other')
    throw stop(
      'exists with a different deployment policy. Claude Code reviews it before this runs again.',
    );
  if (now === 'unreadable') throw stop('could not be read (gh not signed in, or no access).');
  if (now === 'missing') {
    const put = ghApi(['-X', 'PUT', base, '--input', '-'], { input: putBody });
    if (put.status !== 0) {
      throw stop(
        'could not be created (environments may be unavailable for private repos on this plan). See docs/runbooks/launch.md section 2 for the fallback; Security decides.',
      );
    }
  }
  const post = ghApi([
    '-X',
    'POST',
    `${base}/deployment-branch-policies`,
    '-f',
    'name=main',
    '-f',
    'type=branch',
  ]);
  if (post.status !== 0)
    throw stop('exists but the main-only policy could not be added. Run again.');
  now = state();
  if (now !== 'main') throw stop('did not read back as main only.');
  log('production environment created, main only');
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
  check = ghCheck,
  ghApi = ghApiRun,
  now = () => new Date(),
}) {
  const call = makeClient({ fetchFn, token, dryRun, log });
  const failures = [];
  const step = async (label, fn, skipCode) => {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof SetupError)) throw err;
      if (skipCode && err.codes.includes(skipCode)) {
        log(`skip (already exists) ${label}`);
        return undefined;
      }
      failures.push(`${label}: ${err.message}`);
      log(`FAILED ${label}: ${err.message}`);
      return undefined;
    }
  };

  // Before the first Cloudflare change: the secrets must have somewhere to go (no secret is read or written here).
  if (!dryRun && !check(['--version'])) {
    throw new SetupError(
      'The gh command is not installed or not on PATH. Install it and run gh auth login.',
    );
  }
  await ensureEnvironment({ repo, ghApi, log, dryRun });

  const zones = await call('GET', `/zones?name=${DOMAIN}&account.id=${accountId}`, null, [
    { id: '<zone_id>', status: 'active' },
  ]);
  const zone = zones?.[0];
  if (!zone) throw new SetupError(`Zone ${DOMAIN} not found in this account`);
  if (zone.status !== 'active')
    throw new SetupError(`Zone ${DOMAIN} is ${zone.status}, not active`);
  const zoneId = zone.id;

  // Pages project and custom domains. The project hostname is read from the response (field unverified).
  const created = await step(
    'pages project',
    () =>
      call(
        'POST',
        `/accounts/${accountId}/pages/projects`,
        { name: project, production_branch: 'main' },
        { subdomain: `${project}.pages.dev` },
      ),
    ALREADY_EXISTS.pagesProject,
  );
  const target = created?.subdomain ?? `${project}.pages.dev`;
  for (const name of [DOMAIN, `www.${DOMAIN}`]) {
    await step(
      `pages domain ${name}`,
      () => call('POST', `/accounts/${accountId}/pages/projects/${project}/domains`, { name }),
      ALREADY_EXISTS.pagesDomain,
    );
  }

  const existing = await call('GET', `/zones/${zoneId}/dns_records?per_page=500`, null, []);
  const have = new Set((existing ?? []).map(recordKey));
  // A second SPF record is a permanent error for receivers, so any existing apex SPF record counts as present.
  const hasSpf = (existing ?? []).some(
    (r) =>
      r.type === 'TXT' &&
      String(r.name).toLowerCase() === DOMAIN &&
      unquote(r.content).startsWith('v=spf1'),
  );
  for (const record of dnsPlan(target)) {
    if (hasSpf && record.type === 'TXT' && record.name === DOMAIN) {
      log('skip (apex SPF record exists)');
      continue;
    }
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

  const rum = await step(
    'web analytics',
    () =>
      call(
        'POST',
        `/accounts/${accountId}/rum/site_info`,
        { host: DOMAIN, zone_tag: zoneId, auto_install: true },
        { site_tag: '<site_tag>' },
      ),
    ALREADY_EXISTS.webAnalytics,
  );
  if (rum?.site_tag) log(`Web Analytics site tag: ${rum.site_tag}`);

  // Deploy token: Pages edit only, 90 days. Fails closed if the permission group cannot be found
  // or if a token with this name already exists (its value cannot be read back).
  const tokenName = `${DOMAIN} pages deploy`;
  const deploy = await step('deploy token', async () => {
    const tokens = await call('GET', `/accounts/${accountId}/tokens`, null, []);
    const old = (tokens ?? []).find((t) => t.name === tokenName);
    if (old) {
      throw new SetupError(
        `A token named "${tokenName}" already exists (id ${old.id}, expires ${old.expires_on ?? 'never'}). Its value cannot be read back, so no second token was made and the secrets were not changed. If the secrets are missing, delete that token in Cloudflare (My Profile, API Tokens) and run this again.`,
      );
    }
    const groups = await call('GET', `/accounts/${accountId}/tokens/permission_groups`, null, [
      { id: '<pages_group_id>', name: PAGES_GROUP_NAMES[0] },
    ]);
    const group = (groups ?? []).find((g) => PAGES_GROUP_NAMES.includes(g.name));
    if (!group) throw new SetupError(`No permission group named ${PAGES_GROUP_NAMES.join(' or ')}`);
    // Cloudflare accepts 2005-12-30T01:02:03Z only: no milliseconds (#281).
    const expires = new Date(now().getTime() + 90 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z');
    const result = await call(
      'POST',
      `/accounts/${accountId}/tokens`,
      {
        name: tokenName,
        policies: [
          {
            effect: 'allow',
            permission_groups: [{ id: group.id }],
            resources: { [`com.cloudflare.api.account.${accountId}`]: '*' },
          },
        ],
        expires_on: expires,
      },
      { value: '<deploy token>', id: '<token id>' },
    );
    if (!result?.value) throw new SetupError('Token created but the response had no value');
    log(
      `Created deploy token "${tokenName}" (id ${result.id}). If storing the secrets fails, delete it in Cloudflare.`,
    );
    return result;
  });
  const deployToken = deploy?.value;

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

const idPattern = /^[0-9a-f]{32}$/;
const projectPattern = /^[a-z0-9][a-z0-9-]{0,57}$/;
const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const valueFlags = {
  '--account': ['Account ID', idPattern],
  '--zone': ['Zone ID', idPattern],
  '--project': ['project name', projectPattern],
  '--repo': ['repository', repoPattern],
};

// Error text never repeats input: a pasted secret must not come back out in a message (or a shared dry-run).
export function parseArgs(argv) {
  const out = { dryRun: false, link: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--link') out.link = true;
    else if (Object.hasOwn(valueFlags, a)) {
      const [label, pattern] = valueFlags[a];
      const v = argv[++i];
      if (v === undefined || !pattern.test(v)) throw new SetupError(`${a} needs a valid ${label}.`);
      out[a.slice(2)] = v;
    } else {
      throw new SetupError(
        'Unexpected argument. Allowed: --link, --dry-run, --account, --zone, --project, --repo.',
      );
    }
  }
  return out;
}

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
    console.error(
      err instanceof SetupError
        ? err.message
        : `Unexpected error (${err.name}). Nothing was printed that could contain a secret.`,
    );
    process.exit(1);
  });
}
