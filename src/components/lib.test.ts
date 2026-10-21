import { describe, expect, it } from 'vitest';
import {
  barPercent,
  claimMap,
  compareStart,
  fill,
  lowerFirst,
  splitEmail,
  startOf,
  yearSpan,
} from './lib.ts';

const claims = claimMap([
  { id: 'a-count', value: 40, display: '40% fewer pending trades' },
  { id: 'b-text', value: '~7x', display: '~7x' },
]);

describe('fill', () => {
  it('uses display text by default and the raw value with .value', () => {
    expect(fill('{{a-count}}', claims)).toBe('40% fewer pending trades');
    expect(fill('{{a-count.value}}%', claims)).toBe('40%');
    expect(fill('about {{b-text}}', claims)).toBe('about ~7x');
  });
  it('leaves text without slots alone', () => {
    expect(fill('plain text', claims)).toBe('plain text');
  });
  it('throws on an unknown claim id', () => {
    expect(() => fill('{{missing}}', claims)).toThrow(/Unknown claim id "missing"/);
  });
});

describe('startOf', () => {
  it('reads the start month and year of every range form in the content', () => {
    expect(startOf('Oct 2026')).toMatchObject({ year: 2026, month: 10, label: 'Oct 2026' });
    expect(startOf('Nov to Dec 2025')).toMatchObject({ year: 2025, month: 11, iso: '2025-11' });
    expect(startOf('Jan 2021 to Jun 2024')).toMatchObject({ year: 2021, month: 1 });
    expect(startOf('Apr to Aug 2026').label).toBe('Apr 2026');
  });
  it('handles a plain year', () => {
    expect(startOf('2021')).toEqual({ year: 2021, month: 0, label: '2021', iso: '2021' });
  });
  it('throws without a year', () => {
    expect(() => startOf('Oct')).toThrow(/No year/);
  });
  it('sorts by year then month', () => {
    const list = ['Sep 2026', 'Nov to Dec 2025', 'Feb to Mar 2026'].map(startOf);
    list.sort(compareStart);
    expect(list.map((s) => s.iso)).toEqual(['2025-11', '2026-02', '2026-09']);
  });
});

describe('yearSpan', () => {
  it('reduces a range to its years', () => {
    expect(yearSpan('Aug 2024 to May 2026')).toBe('2024 to 2026');
    expect(yearSpan('Aug 2017 to May 2021')).toBe('2017 to 2021');
    expect(yearSpan('Oct 2026')).toBe('2026');
  });
});

describe('splitEmail', () => {
  it('splits after the at sign', () => {
    expect(splitEmail('a@b.co')).toEqual(['a@', 'b.co']);
    expect(() => splitEmail('nope')).toThrow();
  });
});

describe('barPercent', () => {
  it('scales to the axis, rounds and clamps', () => {
    expect(barPercent(3, 8)).toBe(37.5);
    expect(barPercent(3.2, 10)).toBe(32);
    expect(barPercent(0, 100)).toBe(0);
    expect(barPercent(120, 100)).toBe(100);
    expect(barPercent(81.78, 100)).toBe(81.78);
  });
  it('rejects a bad axis', () => {
    expect(() => barPercent(1, 0)).toThrow();
  });
});

describe('lowerFirst', () => {
  it('lowercases the first letter only', () => {
    expect(lowerFirst('Available now')).toBe('available now');
  });
});
