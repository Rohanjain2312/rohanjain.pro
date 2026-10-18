// Golden set (docs/spec/09-quality.md section 9.4, ADR-0028).
// Expected verdicts come from docs/qa/fit-rubric.md, written before the engine ran on any posting.
// A failure here means the engine and the rubric disagree. Fix aliases or tiers first (R-407).
// Change a threshold only with an ADR in the same PR (R-404).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyze, extras } from '../../src/lib/fitcheck/index.ts';
import { config } from '../../src/lib/fitcheck/thresholds.ts';
import {
  isNegativeControl,
  postingFiles,
  postingText,
  postings,
  samples,
  skills,
  verdicts,
} from './golden-helpers.ts';

const BANDS = { strong: 0.8, good: 0.55, minMatches: 4 };

/** The rubric's own arithmetic (rule 8 in docs/qa/fit-rubric.md). It does not call the engine. */
function rubricVerdict(proven: number, gaps: number): string {
  const n = proven + gaps;
  if (n < BANDS.minMatches) return 'Not enough to go on';
  const ratio = proven / n;
  if (ratio >= BANDS.strong) return 'Strong fit';
  if (ratio >= BANDS.good) return 'Good fit, with gaps';
  return 'Not a strong fit';
}

describe('golden set shape (ADR-0028)', () => {
  it('has 20 postings: 4 ai, 4 ml, 4 ds, 3 unrelated, 3 adjacent, 2 plain-words', () => {
    const count = (family: string): number =>
      postings.filter((p) => p.roleFamily === family).length;
    expect(postings).toHaveLength(20);
    expect([
      count('ai'),
      count('ml'),
      count('ds'),
      count('unrelated'),
      count('adjacent'),
      count('plain-words'),
    ]).toEqual([4, 4, 4, 3, 3, 2]);
  });
  it('names each file after its id and gives every posting the required fields only', () => {
    for (const [i, p] of postings.entries()) {
      expect(postingFiles[i], p.id).toBe(`${p.id}.json`);
      expect(Object.keys(p).sort(), p.id).toEqual(['company', 'id', 'requirements', 'roleFamily']);
      expect(p.requirements.length, p.id).toBeGreaterThanOrEqual(4);
      for (const line of p.requirements) {
        expect(line.length, `${p.id}: ${line}`).toBeLessThan(200);
      }
    }
  });
  it('holds nothing that ties a posting to a real one: no URL, email, digits-as-dates or company', () => {
    const text = postings.map((p) => `${p.company}\n${p.requirements.join('\n')}`).join('\n');
    expect(text).not.toMatch(/https?:|www\.|@|\.com\b|\.org\b|\.io\b/i);
    expect(text).not.toMatch(/\b(19|20)\d{2}\b/);
    expect(postings.every((p) => /^[a-z0-9 ,.-]+$/i.test(p.company))).toBe(true);
  });
  it('has an expected verdict for every posting and every sample, and no stray ones', () => {
    expect(Object.keys(verdicts.postings).sort()).toEqual(postings.map((p) => p.id).sort());
    expect(Object.keys(verdicts.samples).sort()).toEqual(samples.map((s) => s.id).sort());
  });
});

describe('rubric self-check (no engine)', () => {
  const tier = new Map(skills.map((s) => [s.name, s.tier]));
  const entries = [
    ...Object.entries(verdicts.postings),
    ...Object.entries(verdicts.samples).map(([id, e]) => [`sample ${id}`, e] as const),
  ];
  it.each(entries)(
    '%s: tiers match skills.json and the counts give the expected verdict',
    (_id, e) => {
      for (const name of e.proven) expect(['shipped', 'work'], name).toContain(tier.get(name));
      for (const name of e.gaps) expect(tier.get(name), name).toBe('studied');
      for (const name of e.unlisted) expect(tier.has(name), name).toBe(false);
      expect(new Set([...e.proven, ...e.gaps, ...e.unlisted]).size).toBe(
        e.proven.length + e.gaps.length + e.unlisted.length,
      );
      expect(rubricVerdict(e.proven.length, e.gaps.length + e.unlisted.length)).toBe(e.expected);
    },
  );
  it('verdicts.json names the same rubric version as docs/qa/fit-rubric.md', () => {
    const rubric = readFileSync('docs/qa/fit-rubric.md', 'utf8');
    const latest = [...rubric.matchAll(/^\| (\d+) \| \d{4}-\d{2}-\d{2} \|/gm)].map((m) =>
      Number(m[1]),
    );
    expect(verdicts.rubricVersion).toBe(Math.max(...latest));
    expect(rubric).toContain(`Version ${verdicts.rubricVersion},`);
  });
  it('records that the Reader Advocate has not rated yet', () => {
    expect(verdicts.raters.qa).toBe('done');
    expect(verdicts.raters.readerAdvocate).toBe('not yet rated');
  });
});

describe('engine against the rubric: golden postings', () => {
  it.each(postings.map((p) => [p.id, p] as const))('%s gets its expected verdict', (id, p) => {
    const expected = verdicts.postings[id]?.expected;
    expect(analyze(postingText(p), skills, extras, []).verdict).toBe(expected);
  });
});

describe('engine against the rubric: negative controls', () => {
  const controls = postings.filter(isNegativeControl);
  it('has six negative controls', () => {
    expect(controls).toHaveLength(6);
  });
  it.each(controls.map((p) => [p.id, p] as const))('%s returns "Not a strong fit"', (_id, p) => {
    const report = analyze(postingText(p), skills, extras, []);
    expect(report.verdict).toBe('Not a strong fit');
    expect(report.enough).toBe(true);
  });
});

describe('engine against the rubric: plain-word negative controls (issue #243, ADR-0030)', () => {
  // Non-technical postings built from ordinary words that are also skill names. They must not read as a fit.
  const controls = postings.filter((p) => p.roleFamily === 'plain-words');
  it('has two plain-word controls, the nurse and the lab technician', () => {
    expect(controls.map((p) => p.id)).toEqual(['neg-lab', 'neg-nurse']);
  });
  it.each(controls.map((p) => [p.id, p] as const))(
    '%s returns "Not enough to go on" with nothing counted',
    (_id, p) => {
      const report = analyze(postingText(p), skills, extras, []);
      expect(report.verdict).toBe('Not enough to go on');
      expect(report.enough).toBe(false);
      expect(report.proven).toEqual([]);
      expect(report.gaps).toEqual([]);
    },
  );
  it('the controls hold only the words that rubric rule 9 holds back', () => {
    // Every counted-looking word in a control is a plain-word skill, so the rubric counts none of them.
    for (const p of controls) {
      const e = verdicts.postings[p.id];
      expect([e?.proven, e?.gaps, e?.unlisted]).toEqual([[], [], []]);
    }
  });
});

describe('rubric rule 9: plain-word skills in the expected lists need context', () => {
  const plain = new Set(config.plainWordSkills);
  const entries = [
    ...Object.entries(verdicts.postings),
    ...Object.entries(verdicts.samples).map(([id, e]) => [`sample ${id}`, e] as const),
  ];
  it.each(entries)('%s lists a plain-word skill only beside 2 other proven skills', (_id, e) => {
    const listed = [...e.proven, ...e.gaps];
    if (!listed.some((n) => plain.has(n))) return;
    expect(e.proven.filter((n) => !plain.has(n)).length).toBeGreaterThanOrEqual(
      config.minContextMatches,
    );
  });
});

describe('engine against the rubric: on-site samples', () => {
  it.each(samples.map((s) => [s.id, s] as const))(
    'the %s sample gets its expected verdict',
    (id, s) => {
      expect(analyze(s.jd, skills, extras, []).verdict).toBe(verdicts.samples[id]?.expected);
    },
  );
  it('the samples are the three the page offers, in order', () => {
    expect(samples.map((s) => s.label)).toEqual(['AI Engineer', 'Data Scientist', 'iOS Engineer']);
  });
});
