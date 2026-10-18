// Alias audit (docs/spec/09-quality.md section 9.4 item 6, R-406).
// For every matchable term (skill names, aliases, extras), count the negative-control postings it matches.
// A term that matches more than a third of them is too broad.
import { describe, expect, it } from 'vitest';
import {
  compileMatcher,
  containsTerm,
  extras,
  normalizeText,
} from '../../src/lib/fitcheck/index.ts';
import { isNegativeControl, postingText, postings, skills } from './golden-helpers.ts';

const controls = postings.filter(isNegativeControl).map((p) => normalizeText(postingText(p)));
const limit = controls.length / 3;
const matcher = compileMatcher(skills, extras);

interface Row {
  owner: string;
  term: string;
  hits: number;
}

const rows: Row[] = [
  ...matcher.skills.flatMap((s) => s.terms.map((term) => ({ owner: s.skill.name, term }))),
  ...matcher.extras.flatMap((x) => x.terms.map((term) => ({ owner: x.extra.name, term }))),
].map((r) => ({ ...r, hits: controls.filter((text) => containsTerm(text, r.term)).length }));

const SUSPECTS = [
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

describe('alias audit against the negative controls (R-406)', () => {
  it('audits six negative controls, so the limit is two postings per term', () => {
    expect(controls).toHaveLength(6);
    expect(limit).toBe(2);
  });
  it('audits every term of every skill and extra', () => {
    expect(rows.length).toBeGreaterThan(400);
    expect(new Set(rows.map((r) => r.owner)).size).toBeGreaterThan(320);
  });
  it('no term matches more than a third of the negative controls', () => {
    const tooBroad = rows.filter((r) => r.hits > limit);
    expect(tooBroad, JSON.stringify(tooBroad)).toEqual([]);
  });
  it('none of the known broad seed words is a term', () => {
    const terms = new Set(rows.map((r) => r.term));
    expect(SUSPECTS.filter((w) => terms.has(w))).toEqual([]);
  });
  it('the audit catches a broad term (detector check)', () => {
    // "android" is in two controls, "and" is in all six: the second must be flagged by the same rule.
    const probe = controls.filter((text) => containsTerm(text, 'and')).length;
    expect(probe).toBeGreaterThan(limit);
  });
  it('reports the numbers', () => {
    const hit = rows.filter((r) => r.hits > 0);
    const max = Math.max(...rows.map((r) => r.hits));
    const worst = rows.filter((r) => r.hits === max).map((r) => `${r.term} (${r.owner})`);
    console.log(
      `alias audit: ${rows.length} terms, ${hit.length} match at least one of ${controls.length} negative controls, highest count ${max} (limit ${limit}): ${worst.join(', ')}`,
    );
    expect(max).toBeLessThanOrEqual(limit);
  });
});
