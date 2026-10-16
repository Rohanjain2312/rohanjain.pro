#!/usr/bin/env node
// Docs lint (R-806, R-805, R-610). Fails on: duplicated or orphaned rule definitions, inventory/home mismatches,
// dangling rule references, broken internal paths, token budgets, misplaced instruction files, task lists in the spec,
// and owners.json drifting from agent files. Run: node scripts/lint-docs.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'state', 'worktrees', '.astro'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const read = (p) => readFileSync(p, 'utf8');
const tokens = (s) => Math.ceil(s.length / 3.5);

const instructionFiles = ['CLAUDE.md', 'plan.md']
  .filter((f) => existsSync(f))
  .map((f) => join(ROOT, f))
  .concat(walk(join(ROOT, '.claude')).filter((p) => p.endsWith('.md')))
  .concat(walk(join(ROOT, 'docs')).filter((p) => p.endsWith('.md')));
const hookFiles = walk(join(ROOT, '.claude', 'hooks')).filter((p) => p.endsWith('.mjs'));

// 1. Inventory
const inv = new Map();
const rulesMd = read(join(ROOT, 'docs', 'rules.md'));
for (const line of rulesMd.split('\n')) {
  const m = line.match(
    /^\|\s*(\*\*)?(R-\d{3})(\*\*)?\s*(★)?\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/,
  );
  if (!m) continue;
  const home = m[6].trim() === 'here' ? 'docs/rules.md' : m[6].trim().replace(/`/g, '');
  if (inv.has(m[2])) err(`${m[2]} is listed twice in docs/rules.md`);
  inv.set(m[2], { home, enforced: m[7].trim(), status: m[8].trim() });
}

// 2. Definitions (**R-xxx**) must be unique, listed, and in the listed home.
const defs = new Map();
for (const f of instructionFiles) {
  for (const m of read(f).matchAll(/\*\*(R-\d{3})\*\*/g)) {
    const list = defs.get(m[1]) || new Set();
    list.add(rel(f));
    defs.set(m[1], list);
  }
}
for (const [id, files] of defs) {
  if (files.size > 1) err(`${id} is defined in more than one file: ${[...files].join(', ')}`);
  if (!inv.has(id))
    err(`${id} is defined in ${[...files][0]} but missing from docs/rules.md (orphan)`);
}
for (const [id, r] of inv) {
  const files = defs.get(id);
  if (!files) err(`${id} is listed in docs/rules.md but defined nowhere (expected in ${r.home})`);
  else if (!files.has(r.home))
    err(`${id} should be defined in ${r.home} but is in ${[...files].join(', ')}`);
}

// 3. Active hook-enforced rules must be referenced by a hook.
const hookText = hookFiles.map(read).join('\n');
for (const [id, r] of inv) {
  if (
    /hook/i.test(r.enforced) &&
    /active/.test(r.status) &&
    !/Stop hook|SessionStart/.test(r.enforced) &&
    !hookText.includes(id)
  )
    err(`${id} claims an active hook but no file in .claude/hooks/ enforces it`);
}

// 4. Dangling references.
for (const f of instructionFiles.concat(hookFiles)) {
  for (const m of read(f).matchAll(/\bR-\d{3}\b/g))
    if (!inv.has(m[0])) err(`${rel(f)} references ${m[0]}, which is not in docs/rules.md`);
}

// 5. Internal paths that must exist now.
const mustExist =
  /^(docs\/spec\/[\w.-]+\.md|docs\/rules\.md|docs\/status\.md|docs\/needs-client\.md|plan\.md|CLAUDE\.md|reference\/README\.md|\.claude\/(agents|rules|hooks)\/[\w.-]+\.(md|mjs|json)|\.claude\/settings\.json|scripts\/lint-docs\.mjs)$/;
for (const f of instructionFiles) {
  for (const m of read(f).matchAll(/`([^`\s]+)`/g)) {
    const p = m[1].replace(/^\.\//, '');
    if (mustExist.test(p) && !existsSync(join(ROOT, p)))
      err(`${rel(f)} points to ${p}, which does not exist`);
  }
}
for (const m of read(join(ROOT, 'plan.md')).matchAll(/`(\.claude\/skills\/[\w-]+\/SKILL\.md)`/g))
  if (!existsSync(join(ROOT, m[1]))) err(`plan.md points to missing ${m[1]}`);
for (const f of instructionFiles)
  for (const m of read(f).matchAll(/skill `([\w-]+)`/g)) {
    if (!existsSync(join(ROOT, '.claude', 'skills', m[1], 'SKILL.md')))
      err(`${rel(f)} names skill ${m[1]}, which does not exist`);
  }

// 6. Token budgets.
const budget = (p, max) => {
  if (existsSync(p)) {
    const t = tokens(read(p));
    if (t > max) err(`${rel(p)} is about ${t} tokens; budget ${max}`);
  }
};
budget(join(ROOT, 'CLAUDE.md'), 2000);
budget(join(ROOT, 'plan.md'), 1500);
for (const p of walk(join(ROOT, '.claude', 'agents'))) budget(p, 1500);
for (const p of walk(join(ROOT, '.claude', 'rules'))) budget(p, 800);
for (const p of walk(join(ROOT, '.claude', 'skills')).filter((x) => x.endsWith('SKILL.md')))
  budget(p, 1500);

// 7. Instruction files where they would be served or ignored.
for (const p of walk(ROOT)) {
  const r = rel(p);
  if (
    r.endsWith('CLAUDE.md') &&
    r !== 'CLAUDE.md' &&
    r !== '.claude/CLAUDE.md' &&
    !r.startsWith('reference/')
  )
    err(`${r}: use .claude/rules/ with paths: instead of a nested CLAUDE.md (R-610)`);
  if (/^public\/.*\.md$/.test(r) || /^src\/pages\/.*\.md$/.test(r))
    err(`${r}: Markdown here would be served as a page (R-610)`);
}

// 8. No task lists in the plan or spec (R-805).
for (const f of [join(ROOT, 'plan.md'), ...walk(join(ROOT, 'docs', 'spec'))]) {
  read(f)
    .split('\n')
    .forEach((l, i) => {
      if (
        /^\s*- \[[ x]\]/.test(l) &&
        !/Launch checklist/.test(
          read(f)
            .split('\n')
            .slice(Math.max(0, i - 30), i)
            .join('\n'),
        )
      )
        err(`${rel(f)}:${i + 1} has a task checkbox; tasks belong in GitHub Issues (R-805)`);
    });
}

// 9. owners.json matches agent files.
const owners = JSON.parse(read(join(ROOT, '.claude', 'hooks', 'owners.json')));
for (const [role, pats] of Object.entries(owners)) {
  if (role.startsWith('_') || role === 'supervisor') continue;
  const af = join(ROOT, '.claude', 'agents', `${role}.md`);
  if (!existsSync(af)) {
    err(`owners.json has role ${role} but no agent file`);
    continue;
  }
  const txt = read(af);
  for (const p of pats) {
    if (p.startsWith('!')) continue;
    const needle = p.replace(/\*\*$/, '').replace(/\*.*$/, '');
    if (!txt.includes(needle)) err(`${rel(af)} does not mention owned path ${p} from owners.json`);
  }
}

// 10. Warning only: normative prose in the spec without a rule ID.
for (const f of walk(join(ROOT, 'docs', 'spec'))) {
  read(f)
    .split('\n')
    .forEach((l, i) => {
      if (/\b(must|never|always)\b/i.test(l) && !/\bR-\d{3}\b/.test(l))
        warnings.push(`${rel(f)}:${i + 1}`);
    });
}

for (const e of errors) console.log('ERROR ' + e);
console.log(
  `docs lint: ${inv.size} rules, ${defs.size} definitions, ${errors.length} error(s), ${warnings.length} spec line(s) with must/never/always and no rule ID (review at retros).`,
);
process.exit(errors.length ? 1 : 0);
