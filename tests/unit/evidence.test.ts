import { describe, expect, it } from 'vitest';
import { analyze, extras } from '../../src/lib/fitcheck/index.ts';
import { EvidenceError, buildEvidence } from '../../src/lib/content/evidence.ts';
import { loadEvidence, loadRawContent } from '../../src/lib/content/load.ts';
import { evidenceSchema, skillsSchema } from '../../src/lib/content/schemas.ts';
import { validateContent } from '../../src/lib/content/validate.ts';
import { validContent } from './content-fixtures.ts';

const raw = loadRawContent('src/content', {});
const MOCKUP_ORDER = [
  'goldman',
  'loan',
  'tariff',
  'settle',
  'cua',
  'fc',
  'shca',
  'mr',
  'med',
  'gb',
  'ieee',
];

describe('evidence.json (seed)', () => {
  it('passes the schema and cross-file validation', () => {
    expect(evidenceSchema.safeParse(raw.evidence).success).toBe(true);
    expect(validateContent(raw)).toEqual([]);
  });
  it('has the ids that skills.json evidence uses, in the mockup order', () => {
    const records = evidenceSchema.parse(raw.evidence);
    expect(records.map((r) => r.id)).toEqual(MOCKUP_ORDER);
    const used = new Set(skillsSchema.parse(raw.skills).flatMap((s) => s.evidence));
    expect([...used].sort()).toEqual([...MOCKUP_ORDER].sort());
  });
  it('points every proof claim id at a real claim', () => {
    const claimIds = new Set((raw.claims as { id: string }[]).map((c) => c.id));
    for (const r of evidenceSchema.parse(raw.evidence))
      for (const id of r.proofClaimIds) expect(claimIds.has(id), `${r.id}: ${id}`).toBe(true);
  });
});

describe('loadEvidence', () => {
  const items = loadEvidence('src/content');
  it('builds one item per record with the proof from claim display text', () => {
    expect(items.map((i) => i.id)).toEqual(MOCKUP_ORDER);
    const claims = raw.claims as { id: string; display: string }[];
    const display = (id: string) => claims.find((c) => c.id === id)!.display;
    const loan = items.find((i) => i.id === 'loan')!;
    expect(loan.proof.startsWith(`${display('loan-v2-agents')}, ${display('loan-v2-tools')}`)).toBe(
      true,
    );
  });
  it('takes names and links from projects.json, and states names for goldman and ieee', () => {
    const by = Object.fromEntries(items.map((i) => [i.id, i]));
    expect(by['loan']).toMatchObject({ name: 'Loan Servicing Agent', linkLabel: 'code' });
    expect(by['loan']?.href).toMatch(/^https:\/\/github\.com\//);
    expect(by['settle']).toMatchObject({ linkLabel: 'live demo' });
    expect(by['settle']?.href).toContain('huggingface.co/spaces');
    expect(by['shca']?.linkLabel).toBe('live demo');
    expect(by['med']).toMatchObject({ linkLabel: 'model' });
    expect(by['goldman']).toMatchObject({ name: 'Goldman Sachs, production' });
    expect(by['goldman']).not.toHaveProperty('href');
    expect(by['ieee']?.name).toBe('IEEE publication');
  });
  it('works as the evidence input of analyze', () => {
    const skills = skillsSchema.parse(raw.skills);
    const r = analyze(
      'LangGraph agents with human-in-the-loop, RAG and Docker',
      skills,
      extras,
      items,
    );
    expect(r.evidenceRows.length).toBeGreaterThan(0);
    expect(r.evidenceRows[0]?.proof).toBeTruthy();
  });
});

describe('buildEvidence errors and validation', () => {
  const c = validContent();
  it('rejects an unknown claim id', () => {
    const bad = [{ id: 'fake-project', proofClaimIds: ['nope'] }];
    expect(() => buildEvidence(bad, c.projects, c.claims)).toThrow(EvidenceError);
  });
  it('rejects a link the project does not have', () => {
    const bad = [{ id: 'fake-project', proofClaimIds: ['fake-claim-a'], link: 'model' }];
    expect(() => buildEvidence(bad, c.projects, c.claims)).toThrow(/no "model" link/);
  });
  it('needs a name when there is no project', () => {
    const bad = [{ id: 'goldman', proofClaimIds: ['fake-claim-a'] }];
    expect(() => buildEvidence(bad, c.projects, c.claims)).toThrow(/needs a name/);
  });
  it('rejects unknown keys and empty proof lists', () => {
    expect(
      evidenceSchema.safeParse([{ id: 'a', proofClaimIds: ['x'], proof: 'text' }]).success,
    ).toBe(false);
    expect(evidenceSchema.safeParse([{ id: 'a', proofClaimIds: [] }]).success).toBe(false);
  });
  const defects: [string, (d: any) => void, string][] = [
    ['unknown claim', (d) => (d.evidence[0].proofClaimIds = ['nope']), '0.proofClaimIds.0'],
    ['unknown project', (d) => (d.evidence[0].id = 'nope'), '0.id'],
    ['missing link', (d) => (d.evidence[0].link = 'model'), '0.link'],
    ['item with no skill', (d) => (d.skills[0].evidence = ['fake-claim-a']), '0.id'],
    ['duplicate id', (d) => d.evidence.push(d.evidence[0]), '1.id'],
  ];
  for (const [label, mutate, field] of defects) {
    it(`validateContent flags ${label}`, () => {
      const d: any = structuredClone(validContent());
      mutate(d);
      const problems = validateContent(d).filter((p) => p.file === 'evidence.json');
      expect(problems.map((p) => p.field)).toContain(field);
    });
  }
  it('validateContent flags a skill evidence id with no item', () => {
    const d: any = structuredClone(validContent());
    d.evidence = [];
    expect(validateContent(d).map((p) => p.message)).toContain(
      'no item for skill evidence "fake-project"',
    );
  });
});
