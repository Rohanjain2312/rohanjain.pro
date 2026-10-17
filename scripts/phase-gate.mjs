#!/usr/bin/env node
// Phase gate check (issue #16, skill phase-gate). Usage:
//   node scripts/phase-gate.mjs N [--root DIR] [--gh-fixture FILE] [--next-gate YYYY-MM-DD]
// Fails (exit 1) and names the rule for each problem:
//   R-804  docs/phases/phase-N-plan.md, docs/gates/phase-N.md
//   R-511  no open issue labelled severity:medium, severity:high or severity:critical
//   ADR-0018  interaction limit is collaborators_only and does not expire before the next planned gate
// GitHub data comes from the gh CLI (read-only token). --gh-fixture reads
// {"issues":[{"number","title","labels":[...]}],"limit":{"limit","expires_at"}} instead, for tests.
// The next planned gate defaults to 60 days from now; pass --next-gate to override.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const testMode = () => process.env.PHASE_GATE_TEST === '1';
const repo = () => (testMode() && process.env.PHASE_GATE_REPO) || 'Rohanjain2312/rohanjain.pro';
const SEVERITIES = ['severity:medium', 'severity:high', 'severity:critical'];

function parseArgs(argv) {
  const out = { phase: null, root: process.cwd(), fixture: null, nextGate: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') out.root = argv[++i];
    else if (a === '--gh-fixture') out.fixture = argv[++i];
    else if (a === '--next-gate') out.nextGate = argv[++i];
    else if (/^\d+$/.test(a) && out.phase === null) out.phase = Number(a);
    else return null;
  }
  return out.phase === null || !out.root ? null : out;
}

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0)
    throw new Error(`gh ${args.join(' ')} failed: ${(r.stderr || r.error?.message || '').trim()}`);
  return JSON.parse(r.stdout);
}

function githubData(fixture) {
  if (fixture) {
    if (!testMode())
      throw new Error('R-511 --gh-fixture is test-only; refused unless PHASE_GATE_TEST=1');
    return JSON.parse(readFileSync(fixture, 'utf8'));
  }
  const issues = gh([
    'issue',
    'list',
    '-R',
    repo(),
    '--state',
    'open',
    '--limit',
    '1000',
    '--json',
    'number,title,labels',
  ]).map((i) => ({
    number: i.number,
    title: i.title,
    labels: i.labels.map((l) => l.name),
  }));
  const limit = gh(['api', `repos/${repo()}/interaction-limits`]);
  return { issues, limit };
}

export function checkGate({ phase, root, fixture = null, nextGate = null, now = Date.now() }) {
  const failures = [];
  if (nextGate && (!Number.isFinite(Date.parse(nextGate)) || Date.parse(nextGate) < now)) {
    return [
      `ADR-0018 --next-gate "${nextGate}" is unparseable or in the past; give a future YYYY-MM-DD date`,
    ];
  }
  const need = (rule, rel) => {
    if (!existsSync(join(root, rel))) failures.push(`${rule} missing ${rel}`);
  };
  need('R-804', `docs/phases/phase-${phase}-plan.md`);
  need('R-804', `docs/gates/phase-${phase}.md`);

  let data;
  try {
    data = githubData(fixture);
  } catch (e) {
    failures.push(
      `R-511 could not read GitHub data, so open severity labels and the interaction limit are unverified: ${e.message}`,
    );
    return failures;
  }
  for (const i of data.issues) {
    const hit = i.labels.filter((l) => SEVERITIES.includes(l));
    if (hit.length)
      failures.push(`R-511 open issue #${i.number} has ${hit.join(', ')}: ${i.title}`);
  }
  const lim = data.limit || {};
  if (lim.limit !== 'collaborators_only') {
    failures.push(
      `ADR-0018 interaction limit is "${lim.limit ?? 'none'}", expected collaborators_only. Renew it (skill phase-gate step 8).`,
    );
  } else {
    const gate = nextGate ? Date.parse(nextGate) : now + 60 * 86400000;
    const exp = Date.parse(lim.expires_at);
    if (!Number.isFinite(exp) || exp < gate) {
      failures.push(
        `ADR-0018 interaction limit expires ${lim.expires_at ?? 'never set'}, before the next planned gate (${new Date(gate).toISOString().slice(0, 10)}). Renew it.`,
      );
    }
  }
  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.error(
      'usage: node scripts/phase-gate.mjs N [--root DIR] [--gh-fixture FILE] [--next-gate YYYY-MM-DD]',
    );
    process.exit(2);
  }
  const failures = checkGate({
    phase: args.phase,
    root: args.root,
    fixture: args.fixture,
    nextGate: args.nextGate,
  });
  if (failures.length) {
    console.error(`phase ${args.phase} gate FAILED:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(
    `phase ${args.phase} gate OK: records present, no open Medium+ findings, interaction limit valid.`,
  );
}
