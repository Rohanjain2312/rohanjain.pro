// Content against its client-supplied reference (issue #249, row 123-5).
// 1. The skill count and the skill rows match reference/skills_tiered.json (aliases are the only added field).
// 2. Every evidence reference on a skill resolves to a project, a claim or a named source.
// 3. Each role summary in roles.json is the text of reference/role_descriptions.md, word for word.
// The checks are pure functions over parsed data, so each one is also run on a seeded defect and must flag it.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface SkillRow {
  name: string;
  category: string;
  tier: string;
  evidence: string[];
  roles: string[];
  aliases?: string[];
}
interface RoleRow {
  id: string;
  title: string;
  summary: string;
}

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

const skills = readJson<SkillRow[]>('src/content/skills.json');
const reference = readJson<{ skills: SkillRow[] }>('reference/skills_tiered.json').skills;
const roles = readJson<RoleRow[]>('src/content/roles.json');
const claimIds = new Set(readJson<{ id: string }[]>('src/content/claims.json').map((c) => c.id));
const projectIds = new Set(
  readJson<{ id: string }[]>('src/content/projects.json').map((p) => p.id),
);
/** Source ids that are not projects (src/lib/content/validate.ts EVIDENCE_SOURCES). */
const EXTRA_SOURCES = new Set(['goldman', 'ieee']);
const roleText = readFileSync('reference/role_descriptions.md', 'utf8');

/** One message per problem; empty means the skills match the reference. */
function skillProblems(actual: readonly SkillRow[], ref: readonly SkillRow[]): string[] {
  const out: string[] = [];
  if (actual.length !== ref.length)
    out.push(`skill count is ${actual.length}, expected ${ref.length}`);
  const names = actual.map((s) => s.name);
  if (new Set(names).size !== names.length) out.push('a skill name is repeated');
  const byName = new Map(actual.map((s) => [s.name, s]));
  for (const r of ref) {
    const a = byName.get(r.name);
    if (!a) {
      out.push(`${r.name}: missing`);
      continue;
    }
    for (const key of ['category', 'tier', 'evidence', 'roles'] as const) {
      if (JSON.stringify(a[key]) !== JSON.stringify(r[key])) out.push(`${r.name}: ${key} differs`);
    }
  }
  const known = new Set(ref.map((r) => r.name));
  for (const n of names) if (!known.has(n)) out.push(`${n}: not in the reference`);
  return out;
}

function evidenceProblems(rows: readonly SkillRow[]): string[] {
  const ok = (id: string): boolean =>
    projectIds.has(id) || claimIds.has(id) || EXTRA_SOURCES.has(id);
  return rows.flatMap((s) =>
    s.evidence.filter((id) => !ok(id)).map((id) => `${s.name}: unknown evidence "${id}"`),
  );
}

/** Reads `## Title` sections from role_descriptions.md: the body is the text up to the next heading. */
function referenceSummaries(markdown: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const block of markdown.split(/^## /m).slice(1)) {
    const [title = '', ...body] = block.split('\n');
    out.set(title.trim(), body.join('\n').trim());
  }
  return out;
}

function summaryProblems(
  rows: readonly RoleRow[],
  summaries: ReadonlyMap<string, string>,
): string[] {
  const out: string[] = [];
  for (const r of rows) {
    const want = summaries.get(r.title);
    if (want === undefined) out.push(`${r.id}: no "${r.title}" section in role_descriptions.md`);
    else if (r.summary !== want) out.push(`${r.id}: summary differs from role_descriptions.md`);
  }
  for (const title of summaries.keys())
    if (!rows.some((r) => r.title === title))
      out.push(`${title}: in role_descriptions.md but not in roles.json`);
  return out;
}

describe('skills.json against reference/skills_tiered.json', () => {
  it('has the reference count of 300 skills, with the same names, categories, tiers, evidence and roles', () => {
    expect(reference).toHaveLength(300);
    expect(skills).toHaveLength(300);
    expect(skillProblems(skills, reference)).toEqual([]);
  });
  it('keeps the reference order', () => {
    expect(skills.map((s) => s.name)).toEqual(reference.map((s) => s.name));
  });
  it('flags a dropped skill, a changed tier, changed evidence and an invented skill', () => {
    expect(skillProblems(skills.slice(1), reference).join('\n')).toMatch(/skill count is 299/);
    const tier = skills.map((s, i) =>
      i === 0 ? { ...s, tier: s.tier === 'studied' ? 'shipped' : 'studied' } : s,
    );
    expect(skillProblems(tier, reference)).toEqual([`${skills[0]?.name}: tier differs`]);
    const ev = skills.map((s, i) => (i === 0 ? { ...s, evidence: [...s.evidence, 'loan'] } : s));
    expect(skillProblems(ev, reference)).toEqual([`${skills[0]?.name}: evidence differs`]);
    const renamed = skills.map((s, i) => (i === 0 ? { ...s, name: 'Invented' } : s));
    expect(skillProblems(renamed, reference)).toEqual([
      `${skills[0]?.name}: missing`,
      'Invented: not in the reference',
    ]);
    expect(skillProblems([...skills, skills[0] as SkillRow], reference).join('\n')).toMatch(
      /repeated/,
    );
  });
});

describe('skill evidence references', () => {
  it('every id on every skill is a project, a claim or a named source', () => {
    expect(evidenceProblems(skills)).toEqual([]);
  });
  it('uses every project id, so the check has real input', () => {
    const used = new Set(skills.flatMap((s) => s.evidence));
    for (const id of projectIds) expect(used.has(id), id).toBe(true);
  });
  it('flags an id that exists nowhere', () => {
    const bad = skills.map((s, i) =>
      i === 0 ? { ...s, evidence: [...s.evidence, 'no-such-project'] } : s,
    );
    expect(evidenceProblems(bad)).toEqual([
      `${skills[0]?.name}: unknown evidence "no-such-project"`,
    ]);
  });
});

describe('role summaries against reference/role_descriptions.md', () => {
  const summaries = referenceSummaries(roleText);
  it('reads three sections', () => {
    expect([...summaries.keys()]).toEqual(['AI Engineer', 'ML Engineer', 'Data Scientist']);
  });
  it('roles.json carries each summary word for word', () => {
    expect(roles).toHaveLength(3);
    expect(summaryProblems(roles, summaries)).toEqual([]);
  });
  it('flags a reworded summary, a missing role and a stray role', () => {
    const first = roles[0] as RoleRow;
    const edited = roles.map((r, i) =>
      i === 0 ? { ...r, summary: r.summary.replace('3.5+', '4+') } : r,
    );
    expect(summaryProblems(edited, summaries)).toEqual([
      `${first.id}: summary differs from role_descriptions.md`,
    ]);
    expect(summaryProblems(roles.slice(1), summaries)).toEqual([
      `${first.title}: in role_descriptions.md but not in roles.json`,
    ]);
    const stray = [...roles, { id: 'x', title: 'Product Manager', summary: 'y' }];
    expect(summaryProblems(stray, summaries)).toEqual([
      'x: no "Product Manager" section in role_descriptions.md',
    ]);
  });
});
