import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sampleStrong } from '../lib/fitcheck/samples.ts';
import {
  announcement,
  briefTitle,
  clampField,
  counterText,
  countsLine,
  fillSlots,
  gapLine,
  monthLabel,
  noteFor,
  tagLine,
} from './fit-view.ts';
import copy from './copy/home.json';

const fit = copy.fit;

describe('clampField', () => {
  it('cuts to the cap and leaves shorter text alone', () => {
    expect(clampField('abcdef', 3)).toBe('abc');
    expect(clampField('abc', 3)).toBe('abc');
    expect(clampField('', 3)).toBe('');
  });
});

describe('counterText', () => {
  it('is empty below the point where the counter shows', () => {
    expect(counterText(6999, 8000, 7000)).toBe('');
  });
  it('reads n / cap with thousands separators from that point', () => {
    expect(counterText(7000, 8000, 7000)).toBe('7,000 / 8,000');
    expect(counterText(8000, 8000, 7000)).toBe('8,000 / 8,000');
  });
});

describe('fillSlots', () => {
  it('fills known slots and keeps unknown ones', () => {
    expect(fillSlots('{a} and {b}', { a: 'x' })).toBe('x and {b}');
  });
  it('does not read a value again or treat $ patterns as special', () => {
    expect(fillSlots('{a} {b}', { a: '{b}', b: '$&' })).toBe('{b} $&');
  });
});

describe('report strings', () => {
  it('counts line uses the Report numbers and the copy template', () => {
    expect(countsLine(sampleStrong, fit.counts)).toBe(
      `${sampleStrong.provenCount} proven · ${sampleStrong.gapCount} to ramp up`,
    );
  });
  it('announces the verdict then the counts', () => {
    expect(announcement(sampleStrong, fit.counts)).toBe(
      `Strong fit. ${countsLine(sampleStrong, fit.counts)}`,
    );
  });
  it('has one fixed paragraph for each verdict key', () => {
    expect(noteFor(sampleStrong, fit.notes)).toBe(fit.notes.strong);
    expect(Object.keys(fit.notes).sort()).toEqual(['good', 'none', 'strong', 'weak']);
  });
});

describe('brief strings', () => {
  const t = fit.brief;
  it('names the role and the company', () => {
    expect(briefTitle('Rohan Jain', 'ML Engineer', 'Acme', t)).toBe(
      'Rohan Jain for ML Engineer at Acme',
    );
  });
  it('reads "your role" with no title and drops the company part with none', () => {
    expect(briefTitle('Rohan Jain', '', '', t)).toBe('Rohan Jain for your role');
    expect(briefTitle('Rohan Jain', '  ', 'Acme', t)).toBe('Rohan Jain for your role at Acme');
    expect(briefTitle('Rohan Jain', 'Data Scientist', '', t)).toBe('Rohan Jain for Data Scientist');
  });
  it('keeps visitor text as typed, whatever it contains', () => {
    expect(briefTitle('Rohan Jain', '{company} $& <b>', '{role}', t)).toBe(
      'Rohan Jain for {company} $& <b> at {role}',
    );
  });
  it('lists at most `max` tags', () => {
    expect(tagLine(['a', 'b', 'c'], 2)).toBe('a, b');
    expect(tagLine([], 2)).toBe('');
  });
  it('truncates the gaps line with a count', () => {
    expect(gapLine(['a', 'b'], 3, t.gapsMore)).toBe('a, b.');
    expect(gapLine(['a', 'b', 'c', 'd', 'e'], 3, t.gapsMore)).toBe('a, b, c and 2 more.');
  });
  it('writes the month of the click', () => {
    expect(monthLabel(new Date(2026, 9, 17))).toBe('Oct 2026');
    expect(monthLabel(new Date(2027, 0, 1))).toBe('Jan 2027');
  });
});

describe('copy', () => {
  it('offers the three on-site samples, word for word as the golden fixtures have them', () => {
    const fixture = JSON.parse(readFileSync('tests/fixtures/golden/samples.json', 'utf8')) as {
      id: string;
      label: string;
      company: string;
      title: string;
      jd: string;
    }[];
    expect(fit.samples).toEqual(fixture);
  });
  it('keeps every posting inside the cap', () => {
    for (const s of fit.samples) expect(s.jd.length).toBeLessThanOrEqual(8000);
  });
});
