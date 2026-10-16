#!/usr/bin/env node
// Phase gate check (issue #16, skill phase-gate). Usage:
//   node scripts/phase-gate.mjs N [--root DIR] [--gh-fixture FILE] [--next-gate YYYY-MM-DD]
// Fails (exit 1) and names the rule for each problem:
//   R-804  docs/phases/phase-N-plan.md, docs/demos/phase-N.md, docs/retros/phase-N.md, docs/gates/phase-N.md
//   R-206  docs/qa/review-audit-N.md
//   R-704  docs/qa/audit-N.md (phases 1 and 3 only)
//   R-807  docs/qa/probe-results.md newer than the last .claude/ change (state, worktrees and agent memory excluded)
//   R-511  no open issue labelled severity:medium, severity:high or severity:critical
//   ADR-0018  interaction limit is collaborators_only and does not expire before the next planned gate
// GitHub data comes from the gh CLI (read-only token). --gh-fixture reads
// {"issues":[{"number","title","labels":[...]}],"limit":{"limit","expires_at"}} instead, for tests.
// The next planned gate defaults to 60 days from now; pass --next-gate to override.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO = process.env.PHASE_GATE_REPO || 'Rohanjain2312/rohanjain.pro';
const SEVERITIES = ['severity:medium', 'severity:high', 'severity:critical'];
const CLAUDE_EXCLUDES = [
  '.claude/state',
  '.claude/worktrees',
  '.claude/agent-memory',
  '.claude/settings.local.json',
];

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

function walk(dir, root, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(root, p).split('\\').join('/');
    if (CLAUDE_EXCLUDES.some((x) => rel === x || rel.startsWith(x + '/'))) continue;
    if (statSync(p).isDirectory()) walk(p, root, acc);
    else acc.push(p);
  }
  return acc;
}

// Seconds since epoch of the last change. Uses the last commit time when the paths are tracked, else file mtime.
function lastChange(root, paths, excludes = []) {
  const args = [
    'log',
    '-1',
    '--format=%ct',
    '--',
    ...paths,
    ...excludes.map((x) => `:(exclude)${x}`),
  ];
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  const t = r.status === 0 ? Number(r.stdout.trim()) : NaN;
  if (Number.isFinite(t) && t > 0) return t;
  let max = 0;
  for (const p of paths) {
    const abs = join(root, p);
    if (!existsSync(abs)) continue;
    const files = statSync(abs).isDirectory() ? walk(abs, root) : [abs];
    for (const f of files) max = Math.max(max, Math.floor(statSync(f).mtimeMs / 1000));
  }
  return max;
}

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0)
    throw new Error(`gh ${args.join(' ')} failed: ${(r.stderr || r.error?.message || '').trim()}`);
  return JSON.parse(r.stdout);
}

function githubData(fixture) {
  if (fixture) return JSON.parse(readFileSync(fixture, 'utf8'));
  const issues = gh([
    'issue',
    'list',
    '-R',
    REPO,
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
  const limit = gh(['api', `repos/${REPO}/interaction-limits`]);
  return { issues, limit };
}

export function checkGate({ phase, root, fixture = null, nextGate = null, now = Date.now() }) {
  const failures = [];
  const need = (rule, rel) => {
    if (!existsSync(join(root, rel))) failures.push(`${rule} missing ${rel}`);
  };
  need('R-804', `docs/phases/phase-${phase}-plan.md`);
  need('R-804', `docs/demos/phase-${phase}.md`);
  need('R-804', `docs/retros/phase-${phase}.md`);
  need('R-804', `docs/gates/phase-${phase}.md`);
  need('R-206', `docs/qa/review-audit-${phase}.md`);
  if (phase === 1 || phase === 3) need('R-704', `docs/qa/audit-${phase}.md`);

  const probe = 'docs/qa/probe-results.md';
  if (!existsSync(join(root, probe))) failures.push(`R-807 missing ${probe}`);
  else {
    const probeT = lastChange(root, [probe]);
    const claudeT = lastChange(root, ['.claude'], CLAUDE_EXCLUDES);
    if (probeT < claudeT) {
      failures.push(
        `R-807 ${probe} is older than the last .claude/ change (${new Date(probeT * 1000).toISOString()} < ${new Date(claudeT * 1000).toISOString()}). Re-run the probe test (skill probe-test).`,
      );
    }
  }

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
    `phase ${args.phase} gate OK: records present, probe current, no open Medium+ findings, interaction limit valid.`,
  );
}
