// Fit-check properties (docs/spec/09-quality.md section 9.5). Each runs at least 1,000 generated cases.
// Property 9 (rendering adds no elements) is a component test and belongs to the report component (issue #194).
// Set FC_SEED to explore other inputs; the default seed keeps CI and mutation runs repeatable.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { analyze, compileMatcher, extras, normalizeText } from '../../src/lib/fitcheck/index.ts';
import type { Report, Skill } from '../../src/lib/fitcheck/index.ts';
import { skills } from './golden-helpers.ts';

const RUNS = process.env.FC_RUNS ? Number(process.env.FC_RUNS) : 1000;
const SEED = process.env.FC_SEED ? Number(process.env.FC_SEED) : 20261017;
const params = { numRuns: RUNS, seed: SEED };
const MAX = 8000;

const matcher = compileMatcher(skills, extras);
const tierOf = new Map(skills.map((s) => [s.name, s.tier]));
const isProvenTier = (name: string): boolean => {
  const t = tierOf.get(name);
  return t === 'shipped' || t === 'work';
};

// Every matchable term, split by what it would make the engine report.
const allTerms = [
  ...matcher.skills.flatMap((s) => s.terms),
  ...matcher.extras.flatMap((x) => x.terms),
];
const provenTerms = matcher.skills
  .filter((s) => s.skill.tier !== 'studied')
  .flatMap((s) => s.terms);
const run = (text: string, s: readonly Skill[] = skills): Report => analyze(text, s, extras, []);
// Gap-only terms: matching them alone gives no proven skill (so they cannot raise the ratio).
const gapOnlyTerms = [
  ...matcher.skills.filter((s) => s.skill.tier === 'studied').flatMap((s) => s.terms),
  ...matcher.extras.flatMap((x) => x.terms),
].filter((t) => run(t).provenCount === 0 && run(t).gapCount > 0);

// Ordinary words that are not part of any term, so appended text cannot match anything.
const termWords = new Set(allTerms.flatMap((t) => t.split(/[^a-z0-9+#.]+/)));
const fillerWords = (
  'the team works with people across offices and delivers steady results for customers every quarter ' +
  'we value honest feedback clear writing patient mentoring careful planning friendly meetings strong ' +
  'ownership curious minds healthy balance remote options benefits holidays growth budget travel'
)
  .split(' ')
  .filter((w) => !termWords.has(w));

const separator = fc.constantFrom(' ', ', ', '. ', '\n', ' and ', '; ', ' / ');
const piece = fc.oneof(
  { weight: 3, arbitrary: fc.constantFrom(...allTerms) },
  { weight: 2, arbitrary: fc.constantFrom(...fillerWords) },
);
/** A posting-like text: terms and filler words joined by separators. */
const soup = (maxPieces: number): fc.Arbitrary<string> =>
  fc
    .array(fc.tuple(piece, separator), { maxLength: maxPieces })
    .map((parts) => parts.map(([p, s]) => p + s).join(''));
const anyText = fc.oneof(
  soup(60),
  fc.string({ maxLength: 400 }),
  fc.string({ unit: 'grapheme', maxLength: 200 }),
);

const rank = (v: Report['verdict']): number =>
  v === 'Strong fit' ? 3 : v === 'Good fit, with gaps' ? 2 : v === 'Not a strong fit' ? 1 : 0;

describe('property 1: deterministic', () => {
  it('the same input always gives the same report', () => {
    fc.assert(
      fc.property(anyText, (text) => {
        // A cloned skills array defeats the matcher cache, so this also checks that caching changes nothing.
        const clone = JSON.parse(JSON.stringify(skills)) as Skill[];
        const first = run(text);
        expect(run(text)).toEqual(first);
        expect(run(text, clone)).toEqual(first);
      }),
      params,
    );
  });
});

describe('property 2: studied skills never appear as proven (R-403)', () => {
  it('every proven name is a shipped or work skill, for any text', () => {
    fc.assert(
      fc.property(anyText, (text) => {
        const r = run(text);
        for (const name of r.proven) expect(isProvenTier(name), name).toBe(true);
        for (const name of r.gaps) expect(r.proven.includes(name), name).toBe(false);
      }),
      params,
    );
  });
  it('a text made only of studied-skill terms and repeats has no proven skill', () => {
    const studiedTerms = matcher.skills
      .filter((s) => s.skill.tier === 'studied')
      .flatMap((s) => s.terms)
      .filter((t) => run(t).provenCount === 0);
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...studiedTerms), { minLength: 1, maxLength: 40 }),
        (ts) => {
          const r = run(ts.join(' ; '));
          expect(r.proven).toEqual([]);
          expect(r.evidenceRows).toEqual([]);
        },
      ),
      params,
    );
  });
});

describe('property 3: invariant to letter case, whitespace and Unicode-equivalent forms', () => {
  const mask = fc.array(fc.boolean(), { minLength: 1, maxLength: 40 });
  const applyCase = (text: string, m: boolean[]): string =>
    [...text].map((c, i) => (m[i % m.length] ? c.toUpperCase() : c)).join('');
  const widen = (text: string, m: boolean[]): string =>
    [...text]
      .map((c, i) => {
        const code = c.codePointAt(0) ?? 0;
        return m[i % m.length] && code > 0x20 && code < 0x7f
          ? String.fromCodePoint(code + 0xfee0)
          : c;
      })
      .join('');
  const gap = fc.array(fc.constantFrom(' ', '\t', '\n', ' ', '　', '\r\n'), {
    minLength: 1,
    maxLength: 5,
  });

  it('letter case', () => {
    fc.assert(
      fc.property(soup(60), mask, (text, m) => {
        expect(run(applyCase(text, m))).toEqual(run(text));
      }),
      params,
    );
  });
  it('extra whitespace, including tabs, newlines and non-breaking spaces', () => {
    fc.assert(
      fc.property(soup(40), gap, gap, gap, (text, lead, mid, trail) => {
        const spaced = lead.join('') + text.replace(/ /g, mid.join('')) + trail.join('');
        expect(run(spaced)).toEqual(run(text));
      }),
      params,
    );
  });
  it('full-width forms (NFKC) of any characters', () => {
    fc.assert(
      fc.property(soup(40), mask, (text, m) => {
        expect(run(widen(text, m))).toEqual(run(text));
      }),
      params,
    );
  });
  it('decomposed forms (NFD) of any text', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', maxLength: 150 }), (text) => {
        expect(run(text.normalize('NFD'))).toEqual(run(text));
        expect(run(text.normalize('NFKD'))).toEqual(run(text));
      }),
      params,
    );
  });
});

describe('property 4: appending text with no skill terms changes nothing', () => {
  it('the report is the same', () => {
    expect(fillerWords.length).toBeGreaterThan(30);
    expect(run(fillerWords.join(' ')).provenCount + run(fillerWords.join(' ')).gapCount).toBe(0);
    fc.assert(
      fc.property(
        soup(60),
        fc.array(fc.constantFrom(...fillerWords), { minLength: 1, maxLength: 200 }),
        (text, words) => {
          expect(run(`${text} ${words.join(' ')}`)).toEqual(run(text));
        },
      ),
      params,
    );
  });
});

describe('property 5: monotonic in proven skills and gaps', () => {
  it('adding a proven skill alias never lowers the proven count', () => {
    fc.assert(
      fc.property(soup(60), fc.constantFrom(...provenTerms), (text, term) => {
        const before = run(text);
        const after = run(`${text} ${term}`);
        expect(after.provenCount).toBeGreaterThanOrEqual(before.provenCount);
        for (const name of before.proven) expect(after.proven).toContain(name);
      }),
      params,
    );
  });
  it('adding a gap term never raises the verdict or the ratio', () => {
    expect(gapOnlyTerms.length).toBeGreaterThan(100);
    fc.assert(
      fc.property(soup(60), fc.constantFrom(...gapOnlyTerms), (text, term) => {
        const before = run(text);
        const after = run(`${text} ${term}`);
        expect(after.provenCount).toBe(before.provenCount);
        expect(after.gapCount).toBeGreaterThanOrEqual(before.gapCount);
        expect(after.ratio).toBeLessThanOrEqual(before.ratio);
        // From "Not enough to go on" the verdict can only leave that label; otherwise it never rises.
        if (before.enough) expect(rank(after.verdict)).toBeLessThanOrEqual(rank(before.verdict));
      }),
      params,
    );
  });
});

describe('property 6: input is cut at 8,000 characters', () => {
  const longText = fc
    .array(fc.tuple(piece, separator), { minLength: 1, maxLength: 120 })
    .map((parts) => parts.map(([p, s]) => p + s).join(''))
    .chain((chunk) =>
      fc
        .integer({ min: MAX + 1, max: 12000 })
        .map((len) => chunk.repeat(Math.ceil(len / chunk.length)).slice(0, len)),
    );
  it('any longer input gives the same result as its first 8,000 characters', () => {
    fc.assert(
      fc.property(longText, (text) => {
        expect(text.length).toBeGreaterThan(MAX);
        expect(run(text)).toEqual(run(text.slice(0, MAX)));
        expect(normalizeText(text).length).toBeLessThanOrEqual(MAX);
      }),
      params,
    );
  });
  it('text after the cut never adds a match', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allTerms), fc.integer({ min: 0, max: 500 }), (term, extra) => {
        const text = 'x'.repeat(MAX) + ' '.repeat(extra) + term;
        expect(run(text).provenCount + run(text).gapCount).toBe(0);
      }),
      params,
    );
  });
});

describe('property 7: any input up to 8,000 characters finishes in under 50 ms', () => {
  const pattern = fc.constantFrom(
    'a',
    'a ',
    '(a+)+ ',
    'c+',
    'java',
    'python ',
    '. ',
    '́',
    '\ud83d',
    'x-ray ',
    'r ',
    's3 ',
    '　',
    '[',
    '\\',
    ...allTerms.slice(0, 40),
  );
  const adversarial = fc
    .tuple(pattern, fc.integer({ min: 1, max: MAX }))
    .map(([p, n]) => p.repeat(Math.ceil(n / p.length)).slice(0, n));
  const input = fc.oneof(
    adversarial,
    fc.string({ maxLength: MAX }),
    soup(2000).map((t) => t.slice(0, MAX)),
  );
  it('takes under 50 ms (best of three, so a scheduler pause does not fail a linear scan)', () => {
    run('warm up');
    fc.assert(
      fc.property(input, (text) => {
        expect(text.length).toBeLessThanOrEqual(MAX);
        const times = [0, 1, 2].map(() => {
          const start = performance.now();
          run(text);
          return performance.now() - start;
        });
        expect(Math.min(...times)).toBeLessThan(50);
      }),
      params,
    );
  });
});

describe('property 8: the verdict follows the documented thresholds for its counts', () => {
  // Thresholds restated from docs/spec/06-architecture.md section 5.4 and ADR-0029, not read from the engine.
  const documented = (matches: number, ratio: number): Report['verdict'] =>
    matches < 4
      ? 'Not enough to go on'
      : ratio >= 0.8
        ? 'Strong fit'
        : ratio >= 0.55
          ? 'Good fit, with gaps'
          : 'Not a strong fit';
  it('verdict, key, flags and ratio agree with the counts', () => {
    fc.assert(
      fc.property(anyText, (text) => {
        const r = run(text);
        const matches = r.provenCount + r.gapCount;
        expect(r.provenCount).toBe(r.proven.length);
        expect(r.gapCount).toBe(r.gaps.length);
        expect(r.enough).toBe(matches >= 4);
        expect(r.ratio).toBe(matches === 0 ? 0 : r.provenCount / matches);
        expect(r.verdict).toBe(documented(matches, r.ratio));
        const key = {
          'Strong fit': 'strong',
          'Good fit, with gaps': 'good',
          'Not a strong fit': 'weak',
          'Not enough to go on': 'none',
        }[r.verdict];
        expect(r.verdictKey).toBe(key);
      }),
      params,
    );
  });
  it('every ratio edge lands in the band the spec names', () => {
    // Pools of single-skill names: matching one alone gives exactly one proven skill or one gap.
    const provenPool = skills
      .filter(
        (s) => s.tier !== 'studied' && run(s.name).provenCount === 1 && run(s.name).gapCount === 0,
      )
      .map((s) => s.name);
    const gapPool = skills
      .filter(
        (s) => s.tier === 'studied' && run(s.name).gapCount === 1 && run(s.name).provenCount === 0,
      )
      .map((s) => s.name);
    expect(provenPool.length).toBeGreaterThan(60);
    expect(gapPool.length).toBeGreaterThan(30);
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 60 }),
        fc.integer({ min: 0, max: 30 }),
        (proven, gaps) => {
          const text = [...provenPool.slice(0, proven), ...gapPool.slice(0, gaps)].join(' ; ');
          const r = run(text);
          const matches = r.provenCount + r.gapCount;
          expect(r.verdict).toBe(documented(matches, matches === 0 ? 0 : r.provenCount / matches));
        },
      ),
      params,
    );
  });
});

describe('the report holds only curated strings', () => {
  // Precondition for property 9: nothing the visitor typed can reach the page through the report.
  const known = new Set<string>([...skills.map((s) => s.name), ...extras.map((x) => x.name)]);
  it('every proven and gap name comes from skills.json or the extras list', () => {
    fc.assert(
      fc.property(anyText, (text) => {
        const r = run(text);
        for (const name of [...r.proven, ...r.gaps]) expect(known.has(name), name).toBe(true);
        expect(Object.keys(r).sort()).toEqual(
          [
            'ratio',
            'enough',
            'evidenceRows',
            'gapCount',
            'gaps',
            'proven',
            'provenCount',
            'roleFamily',
            'verdict',
            'verdictKey',
          ].sort(),
        );
      }),
      params,
    );
  });
});
