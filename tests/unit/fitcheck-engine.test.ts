import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  analyze,
  config,
  containsTerm,
  extras,
  normalizeText,
  verdictFor,
} from '../../src/lib/fitcheck/index.ts';
import type { EvidenceItem, Extra, Skill } from '../../src/lib/fitcheck/index.ts';

function skill(
  name: string,
  tier: Skill['tier'],
  aliases: string[] = [],
  over: Partial<Skill> = {},
): Skill {
  return { name, category: 'test', tier, evidence: [], roles: ['ml'], aliases, ...over };
}

const evidence: EvidenceItem[] = [
  { id: 'a', name: 'Alpha', proof: 'p', href: 'https://example.com', linkLabel: 'code' },
  { id: 'b', name: 'Beta', proof: 'p' },
];

describe('normalizeText', () => {
  it('trims, lowercases, collapses whitespace and applies NFKC', () => {
    expect(normalizeText('  Hello \n\t WORLD  ')).toBe('hello world');
    expect(normalizeText('ＰｙＴｏｒｃｈ')).toBe('pytorch');
    expect(normalizeText('ﬁne')).toBe('fine');
  });
  it('caps at 8,000 characters and equals the cut of the first 8,000', () => {
    const long = 'a'.repeat(9000);
    expect(normalizeText(long)).toHaveLength(8000);
    const mixed = ('word  ' + 'x'.repeat(10)).repeat(2000);
    expect(normalizeText(mixed)).toBe(normalizeText(mixed.slice(0, 8000)));
  });
  it('keeps the cap when NFKC lengthens the text', () => {
    expect(normalizeText('㎏'.repeat(8000)).length).toBeLessThanOrEqual(8000);
  });
});

describe('containsTerm boundaries', () => {
  it('needs a boundary on both sides', () => {
    expect(containsTerm('we use java daily', 'java')).toBe(true);
    expect(containsTerm('we use javascript daily', 'java')).toBe(false);
    expect(containsTerm('subjava', 'java')).toBe(false);
    expect(containsTerm('java,python', 'java')).toBe(true);
    expect(containsTerm('java', 'java')).toBe(true);
  });
  it('keeps c++ and c# whole', () => {
    expect(containsTerm('c++, rust', 'c++')).toBe(true);
    expect(containsTerm('c', 'c++')).toBe(false);
    expect(containsTerm('c#', 'c')).toBe(false);
  });
  it('finds a later valid hit after an invalid one', () => {
    expect(containsTerm('javascript and java', 'java')).toBe(true);
  });
  it('is strict for one and two letter terms', () => {
    expect(containsTerm('python, r, sql', 'r')).toBe(true);
    expect(containsTerm('python/r', 'r')).toBe(true);
    expect(containsTerm('python and r.', 'r')).toBe(true);
    expect(containsTerm('r&d team', 'r')).toBe(false);
    expect(containsTerm('r-based', 'r')).toBe(false);
    expect(containsTerm('s3 buckets', 's3')).toBe(true);
    expect(containsTerm('ms3', 's3')).toBe(false);
  });
  it('treats an empty term as no match', () => {
    expect(containsTerm('anything', '')).toBe(false);
  });
});

describe('pattern safety (R-402)', () => {
  const skills = [skill('Python', 'shipped')];
  it('treats regex metacharacters in the text as plain text', () => {
    const r = analyze('.* (a+)+$ [x] \\ python ^ | ? {1,2}', skills, [], evidence);
    expect(r.proven).toEqual(['Python']);
  });
  it('treats regex metacharacters in aliases as plain text', () => {
    const odd = [skill('C plus', 'shipped', ['c++', '(a+)+', '[', '\\'])];
    expect(analyze('uses c++ here', odd, [], []).proven).toEqual(['C plus']);
    expect(analyze('uses [ here', odd, [], []).proven).toEqual(['C plus']);
    expect(analyze('aaaa', odd, [], []).proven).toEqual([]);
  });
  it('finishes adversarial 8,000 character inputs under 50 ms', () => {
    const real = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as Skill[];
    analyze('warm up', real, extras, []);
    const inputs = [
      'a'.repeat(8000),
      'a '.repeat(4000),
      ('(a+)+' + ' ').repeat(1600),
      'c+'.repeat(4000),
      ' '.repeat(7999) + 'x',
      'python '.repeat(1143),
      'java'.repeat(2000),
      'x́'.repeat(4000),
      '\ud83d'.repeat(8000),
    ];
    for (const input of inputs) {
      // Best of three, so a scheduler pause on a busy runner does not fail a linear-time scan.
      const times = [0, 1, 2].map(() => {
        const start = performance.now();
        analyze(input, real, extras, []);
        return performance.now() - start;
      });
      expect(Math.min(...times)).toBeLessThan(50);
    }
  });
});

describe('tiers (R-403)', () => {
  const skills = [
    skill('Python', 'shipped'),
    skill('Airflow', 'work'),
    skill('Spark', 'studied'),
    skill('Terraform', 'studied'),
  ];
  it('shipped and work are proven; studied and unknown skills are gaps', () => {
    const swift: Extra[] = [{ name: 'Swift', aliases: ['swiftui'] }];
    const r = analyze('python airflow spark terraform swiftui', skills, swift, []);
    expect(r.proven).toEqual(['Python', 'Airflow']);
    expect(r.gaps).toEqual(['Spark', 'Terraform', 'Swift']);
  });
  it('a studied skill never appears as proven, even when its name is repeated', () => {
    const r = analyze('spark spark spark spark', skills, [], []);
    expect(r.proven).toEqual([]);
    expect(r.gaps).toEqual(['Spark']);
  });
  it('counts a skill once however often it appears', () => {
    expect(analyze('python python python', skills, [], []).provenCount).toBe(1);
  });
  it('does not list an extra twice when a skill has the same name', () => {
    const r = analyze('spark', skills, [{ name: 'spark', aliases: [] }], []);
    expect(r.gaps).toEqual(['Spark']);
  });
});

describe('aliases', () => {
  it('matches through an alias and reports the skill name', () => {
    const r = analyze(
      'experience with sklearn',
      [skill('scikit-learn', 'shipped', ['sklearn'])],
      [],
      [],
    );
    expect(r.proven).toEqual(['scikit-learn']);
  });
  it('matches a skill name alias only when the name is listed in nameNeedsAlias', () => {
    const r = analyze('go to market and react to feedback', [], extras, []);
    expect(r.gaps).toEqual([]);
    expect(analyze('services in golang and reactjs', [], extras, []).gaps).toEqual(['Go', 'React']);
  });
  it('uses NFKC-normalized aliases', () => {
    const r = analyze(
      'ＬＬＭ work',
      [skill('Large Language Models', 'shipped', ['ｌｌｍ'])],
      [],
      [],
    );
    expect(r.proven).toHaveLength(1);
  });
});

describe('scoring', () => {
  it('uses the documented thresholds', () => {
    expect(verdictFor(10, 0.8).verdict).toBe('Strong fit');
    expect(verdictFor(10, 0.79).verdict).toBe('Good fit, with gaps');
    expect(verdictFor(10, 0.55).verdict).toBe('Good fit, with gaps');
    expect(verdictFor(10, 0.54).verdict).toBe('Not a strong fit');
    expect(verdictFor(4, 1).verdict).toBe('Strong fit');
  });
  it('gives "Not enough to go on" under 4 matches whatever the ratio', () => {
    expect(verdictFor(3, 1).verdict).toBe('Not enough to go on');
    expect(verdictFor(0, 0).verdictKey).toBe('none');
    expect(config.minMatches).toBe(4);
  });
  it('computes the ratio from proven and gaps and hits exact band edges', () => {
    const skills = [
      skill('a1', 'shipped'),
      skill('a2', 'shipped'),
      skill('a3', 'shipped'),
      skill('a4', 'shipped'),
      skill('g1', 'studied'),
    ];
    const r = analyze('a1 a2 a3 a4 g1', skills, [], []);
    expect(r.ratio).toBe(0.8);
    expect(r.verdict).toBe('Strong fit');
    expect(r.enough).toBe(true);
    const low = analyze('a1 g1 a2 g2 g1', [...skills, skill('g2', 'studied')], [], []);
    expect(low.provenCount).toBe(2);
    expect(low.gapCount).toBe(2);
    expect(low.ratio).toBe(0.5);
    expect(low.verdict).toBe('Not a strong fit');
  });
  it('returns the empty report for empty text', () => {
    const r = analyze('', [skill('Python', 'shipped')], [], evidence);
    expect(r).toMatchObject({
      verdict: 'Not enough to go on',
      enough: false,
      provenCount: 0,
      gapCount: 0,
      ratio: 0,
      evidenceRows: [],
      roleFamily: 'ml',
    });
  });
});

describe('evidence rows and role family', () => {
  it('ranks rows by matched skills, keeps list order on ties, caps at 4 rows and 8 tags', () => {
    const items: EvidenceItem[] = ['e1', 'e2', 'e3', 'e4', 'e5'].map((id) => ({
      id,
      name: id,
      proof: 'p',
    }));
    const skills = Array.from({ length: 10 }, (_, i) =>
      skill(`s${i}`, 'shipped', [], { evidence: i < 9 ? ['e3'] : ['e1', 'e2', 'e4', 'e5'] }),
    );
    const r = analyze(skills.map((s) => s.name).join(' '), skills, [], items);
    expect(r.evidenceRows.map((x) => x.id)).toEqual(['e3', 'e1', 'e2', 'e4']);
    expect(r.evidenceRows[0]?.matchCount).toBe(9);
    expect(r.evidenceRows[0]?.tags).toHaveLength(8);
  });
  it('skips evidence ids that are not in the evidence list and rows with no match', () => {
    const r = analyze('s0', [skill('s0', 'shipped', [], { evidence: ['zzz', 'b'] })], [], evidence);
    expect(r.evidenceRows.map((x) => x.id)).toEqual(['b']);
    expect(r.evidenceRows[0]).not.toHaveProperty('href');
  });
  it('carries link fields when present', () => {
    const r = analyze('s0', [skill('s0', 'shipped', [], { evidence: ['a'] })], [], evidence);
    expect(r.evidenceRows[0]).toMatchObject({ href: 'https://example.com', linkLabel: 'code' });
  });
  it('studied skills add no evidence rows', () => {
    const r = analyze('s0', [skill('s0', 'studied', [], { evidence: ['a'] })], [], evidence);
    expect(r.evidenceRows).toEqual([]);
  });
  it('picks the family with most matches, ties go to the config order', () => {
    const skills = [
      skill('x1', 'shipped', [], { roles: ['ai'] }),
      skill('x2', 'shipped', [], { roles: ['ai', 'ds'] }),
      skill('x3', 'studied', [], { roles: ['ds'] }),
    ];
    expect(analyze('x1 x2', skills, [], []).roleFamily).toBe('ai');
    expect(analyze('x2 x3', skills, [], []).roleFamily).toBe('ds');
    expect(analyze('x1', skills, [], []).roleFamily).toBe('ai');
  });
});

describe('alias hygiene (R-406 inputs)', () => {
  const real = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as Skill[];
  const suspects = [
    'production',
    'deploy',
    'tools',
    'search',
    'analysis',
    'analytics',
    'metrics',
    'agents',
    'documents',
    'pipelines',
    'evaluation',
    'stakeholders',
    'containers',
  ];
  it('no alias or extra term is a known broad word on its own', () => {
    const terms = [
      ...real.flatMap((s) => s.aliases),
      ...extras.flatMap((x) => [x.name, ...x.aliases]),
    ].map((t) => t.toLowerCase());
    expect(terms.filter((t) => suspects.includes(t))).toEqual([]);
  });
  it('no term repeats another skill or extra name, and none is a bare company name or a cut stem', () => {
    const names = new Set(
      [...real.map((s) => s.name), ...extras.map((x) => x.name)].map((n) => n.toLowerCase()),
    );
    for (const s of real)
      for (const a of s.aliases) {
        const t = a.toLowerCase();
        expect(names.has(t) && t !== s.name.toLowerCase(), `${s.name}: ${a}`).toBe(false);
        expect(['openai', 'anthropic', 'google', 'microsoft', 'meta'], a).not.toContain(t);
        expect(t.endsWith('orchestrat'), a).toBe(false);
      }
  });
  it('matches every skill on its own terms: there is no longest-match rule', () => {
    const r = analyze('We use Function calling daily, plus tool-calling.', real, extras, []);
    expect(r.proven.filter((n) => /calling/i.test(n)).sort()).toEqual([
      'Function calling',
      'Tool calling',
    ]);
    const one = analyze('Function calling only.', real, extras, []);
    expect(one.proven).toContain('Function calling');
    expect(one.proven).not.toContain('Tool calling');
  });
  it('every name listed in nameNeedsAlias has at least one alias', () => {
    for (const name of config.nameNeedsAlias) {
      const owner =
        real.find((s) => s.name === name)?.aliases ?? extras.find((x) => x.name === name)?.aliases;
      expect(owner, name).toBeDefined();
      expect(owner?.length, name).toBeGreaterThan(0);
    }
  });
  it('the bare words in nameNeedsAlias do not match on their own', () => {
    const r = analyze(
      'pay attention to detail, go to market, react quickly, a swift reply, ray of light, lambda, monitoring',
      real,
      extras,
      [],
    );
    expect([...r.proven, ...r.gaps]).toEqual([]);
  });
});

describe('purity', () => {
  it('gives the same report for the same input', () => {
    const skills = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as Skill[];
    const text = 'Build LLM agents with LangGraph, RAG and Docker. Swift is a plus.';
    expect(analyze(text, skills, extras, [])).toEqual(analyze(text, skills, extras, []));
  });
  it('does not change its inputs', () => {
    const skills = [skill('Python', 'shipped', ['py3'])];
    const before = JSON.stringify(skills);
    analyze('python', skills, extras, evidence);
    expect(JSON.stringify(skills)).toBe(before);
  });
});
