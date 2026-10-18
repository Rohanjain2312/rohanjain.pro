// Edge tests for the fit-check engine. Each one pins behavior that a small code change would break
// (mutation testing, docs/spec/09-quality.md section 9.5). They assert exact values, not just "no error".
import { describe, expect, it } from 'vitest';
import {
  analyze,
  compileMatcher,
  config,
  containsTerm,
  extras,
  matcherFor,
  normalizeText,
  verdictFor,
} from '../../src/lib/fitcheck/index.ts';
import type { EvidenceItem, Extra, RoleFamily, Skill } from '../../src/lib/fitcheck/index.ts';
import { normalizeTerm } from '../../src/lib/fitcheck/normalize.ts';
import { skills as realSkills } from './golden-helpers.ts';

function skill(
  name: string,
  tier: Skill['tier'],
  aliases: string[] = [],
  over: Partial<Skill> = {},
): Skill {
  return { name, category: 'test', tier, evidence: [], roles: ['ml'], aliases, ...over };
}

// Built from code points so the source holds no dash or escape the copy lint rejects.
const EM_DASH = String.fromCodePoint(0x2014);
const ELLIPSIS = String.fromCodePoint(0x2026);
const EURO = String.fromCodePoint(0x20ac);
const NBSP = String.fromCodePoint(0xa0);
const DEL = String.fromCodePoint(0x7f);
const IDEOGRAPHIC_SPACE = String.fromCodePoint(0x3000);
const ARABIC_THREE = String.fromCodePoint(0x663);
const SUPERSCRIPT_TWO = String.fromCodePoint(0xb2);
const E_ACUTE = String.fromCodePoint(0xe9);
const CJK = String.fromCodePoint(0x65e5);
const SHARP_S = String.fromCodePoint(0xdf);
const LIGATURE_FI = String.fromCodePoint(0xfb01);
const SQUARE_KG = String.fromCodePoint(0x338f);
const FULLWIDTH_LLM = String.fromCodePoint(0xff2c, 0xff2c, 0xff2d);

describe('containsTerm: word characters', () => {
  it('letters a and z, and digits 0 and 9, continue a word on both sides', () => {
    for (const ch of ['a', 'm', 'z', '0', '5', '9']) {
      expect(containsTerm(`${ch}java`, 'java'), `before ${ch}`).toBe(false);
      expect(containsTerm(`java${ch}`, 'java'), `after ${ch}`).toBe(false);
    }
  });
  it('the characters just outside a-z and 0-9 do not continue a word', () => {
    for (const ch of ['`', '{', '@', '[', '/', ':']) {
      expect(containsTerm(`${ch}java`, 'java'), `before ${ch}`).toBe(true);
      expect(containsTerm(`java${ch}`, 'java'), `after ${ch}`).toBe(true);
    }
  });
  it('+ and # continue a word, so c++ and c# stay whole', () => {
    for (const ch of ['+', '#']) {
      expect(containsTerm(`java${ch}`, 'java')).toBe(false);
      expect(containsTerm(`${ch}java`, 'java')).toBe(false);
    }
    expect(containsTerm('use c++ now', 'c++')).toBe(true);
    expect(containsTerm('use c#', 'c#')).toBe(true);
  });
  it('non-ASCII letters and digits continue a word; other non-ASCII characters do not', () => {
    for (const ch of [E_ACUTE, CJK, SHARP_S, ARABIC_THREE, SUPERSCRIPT_TWO]) {
      expect(containsTerm(`java${ch}`, 'java'), `after ${ch}`).toBe(false);
      expect(containsTerm(`${ch}java`, 'java'), `before ${ch}`).toBe(false);
    }
    for (const ch of [EURO, ELLIPSIS, EM_DASH, NBSP, DEL]) {
      expect(containsTerm(`java${ch}`, 'java'), `after ${ch}`).toBe(true);
      expect(containsTerm(`${ch}java`, 'java'), `before ${ch}`).toBe(true);
    }
  });
  it('a term at the very start or end of the text has a boundary there', () => {
    expect(containsTerm('java x', 'java')).toBe(true);
    expect(containsTerm('x java', 'java')).toBe(true);
  });
  it('a match that starts inside a word does not hide a later overlapping match (issue #249, 195-g)', () => {
    // 'a a' first occurs inside "ba a a" (after "b", so not a word start). The next candidate overlaps it by
    // one character and is clean. A scan that resumes at `at + term.length` would skip it.
    expect(containsTerm('ba a a', 'a a')).toBe(true);
    expect(containsTerm('ba a ab', 'a a')).toBe(false);
  });
  it('an empty term never matches, even in empty text or text ending in a space', () => {
    expect(containsTerm('', '')).toBe(false);
    expect(containsTerm('a ', '')).toBe(false);
    expect(containsTerm('anything', '')).toBe(false);
  });
});

describe('containsTerm: terms of one or two characters', () => {
  const clean = [' ', ',', ';', ':', '(', ')', '[', ']', '"', "'", '/'];
  it('each of the eleven clean neighbors is accepted before and after', () => {
    expect(clean).toHaveLength(11);
    for (const ch of clean) {
      expect(containsTerm(`q${ch}r`, 'r'), `before ${JSON.stringify(ch)}`).toBe(true);
      expect(containsTerm(`r${ch}q`, 'r'), `after ${JSON.stringify(ch)}`).toBe(true);
      expect(containsTerm(`q${ch}f1`, 'f1')).toBe(true);
      expect(containsTerm(`f1${ch}q`, 'f1')).toBe(true);
    }
  });
  it('other neighbors are refused before and after', () => {
    for (const ch of ['-', '&', '_', '.', '+', '#', '=', '*', '!', 'a', '5', E_ACUTE]) {
      expect(containsTerm(`q${ch}r`, 'r'), `before ${ch}`).toBe(false);
      expect(containsTerm(`r${ch}q`, 'r'), `after ${ch}`).toBe(false);
    }
  });
  it('the cut is at two characters: a two-character term is strict, a three-character term is not', () => {
    expect(containsTerm('ab-x', 'ab')).toBe(false);
    expect(containsTerm('x-ab', 'ab')).toBe(false);
    expect(containsTerm('abc-x', 'abc')).toBe(true);
    expect(containsTerm('x-abc', 'abc')).toBe(true);
    expect(containsTerm('r-x', 'r')).toBe(false);
  });
  it('the start and end of the text count as a boundary', () => {
    expect(containsTerm('r', 'r')).toBe(true);
    expect(containsTerm('r x', 'r')).toBe(true);
    expect(containsTerm('x r', 'r')).toBe(true);
  });
  it('a full stop after the term is accepted at the end of the text or before a space only', () => {
    expect(containsTerm('use r.', 'r')).toBe(true);
    expect(containsTerm('use r. then', 'r')).toBe(true);
    expect(containsTerm('use r.x', 'r')).toBe(false);
    expect(containsTerm('use r..', 'r')).toBe(false);
    expect(containsTerm('use r.5', 'r')).toBe(false);
    expect(containsTerm('f1.', 'f1')).toBe(true);
    expect(containsTerm('f1.a', 'f1')).toBe(false);
  });
  it('a refused first hit does not stop the search for a later one', () => {
    expect(containsTerm('r-x and r', 'r')).toBe(true);
    expect(containsTerm('ar and r', 'r')).toBe(true);
  });
});

describe('compileMatcher and matcherFor', () => {
  it('drops empty aliases and duplicate terms', () => {
    const m = compileMatcher([skill('Alpha', 'shipped', ['', 'beta', 'beta', 'alpha'])], []);
    expect(m.skills[0]?.terms).toEqual(['alpha', 'beta']);
    const e = compileMatcher([], [{ name: 'Gamma', aliases: ['', 'gamma', 'delta'] }]);
    expect(e.extras[0]?.terms).toEqual(['gamma', 'delta']);
  });
  it('a skill listed in nameNeedsAlias matches through its aliases only', () => {
    const m = compileMatcher(
      [skill('Go', 'shipped', ['golang']), skill('Plain', 'shipped', ['plain-alias'])],
      [
        { name: 'Swift', aliases: ['swiftui'] },
        { name: 'Other', aliases: [] },
      ],
    );
    expect(m.skills[0]?.terms).toEqual(['golang']);
    expect(m.skills[1]?.terms).toEqual(['plain', 'plain-alias']);
    expect(m.extras[0]?.terms).toEqual(['swiftui']);
    expect(m.extras[1]?.terms).toEqual(['other']);
  });
  it('terms are normalized: NFKC, lower case, single spaces', () => {
    const m = compileMatcher([skill('  Big   Name ', 'shipped', [`${FULLWIDTH_LLM}  Tools`])], []);
    expect(m.skills[0]?.terms).toEqual(['big name', 'llm tools']);
  });
  it('every name in nameNeedsAlias is skipped as a bare word, for any text', () => {
    expect(config.nameNeedsAlias.length).toBeGreaterThanOrEqual(10);
    for (const name of config.nameNeedsAlias) {
      const text = `we want ${name.toLowerCase()} and ${name} here`;
      const r = analyze(text, realSkills, extras, []);
      expect([...r.proven, ...r.gaps], name).not.toContain(name);
    }
    expect(analyze('go to market', realSkills, extras, []).gaps).toEqual([]);
    expect(analyze('services in golang', realSkills, extras, []).gaps).toEqual(['Go']);
  });
  it('returns the same matcher for the same arrays, and a new one for different arrays', () => {
    const s1 = [skill('A', 'shipped')];
    const s2 = [skill('A', 'shipped')];
    const e1: Extra[] = [{ name: 'X', aliases: ['xx'] }];
    const e2: Extra[] = [{ name: 'Y', aliases: ['yy'] }];
    const first = matcherFor(s1, e1);
    expect(matcherFor(s1, e1)).toBe(first);
    expect(matcherFor(s1, e2)).not.toBe(first);
    expect(matcherFor(s1, e2)).toBe(matcherFor(s1, e2));
    expect(matcherFor(s2, e1)).not.toBe(first);
    expect(matcherFor(s1, e1)).toBe(first);
    expect(first.extras[0]?.extra.name).toBe('X');
    expect(matcherFor(s1, e2).extras[0]?.extra.name).toBe('Y');
  });
  it('the same skills with different extras give different reports', () => {
    const s = [skill('A', 'shipped')];
    const one = analyze('a xx yy', s, [{ name: 'X', aliases: ['xx'] }], []);
    const two = analyze('a xx yy', s, [{ name: 'Y', aliases: ['yy'] }], []);
    expect(one.gaps).toEqual(['X']);
    expect(two.gaps).toEqual(['Y']);
  });
});

describe('normalizeText and normalizeTerm', () => {
  it('keeps exactly 8,000 characters and cuts the 8,001st', () => {
    expect(normalizeText('a'.repeat(8000))).toBe('a'.repeat(8000));
    expect(normalizeText('a'.repeat(8001))).toBe('a'.repeat(8000));
    expect(normalizeText('a'.repeat(7999))).toBe('a'.repeat(7999));
  });
  it('cuts to a given cap, before and after NFKC', () => {
    expect(normalizeText('abcdef', 3)).toBe('abc');
    expect(normalizeText('abc', 3)).toBe('abc');
    expect(normalizeText(LIGATURE_FI.repeat(2), 3)).toBe('fif');
    expect(normalizeText(SQUARE_KG.repeat(8000))).toBe('kg'.repeat(4000));
  });
  it('trims and collapses every kind of whitespace to one space', () => {
    expect(normalizeText('  a  ')).toBe('a');
    expect(normalizeText('a  b')).toBe('a b');
    expect(normalizeText('a \t\n\r b')).toBe('a b');
    expect(normalizeText(`${NBSP}a${IDEOGRAPHIC_SPACE}b${NBSP}`)).toBe('a b');
    expect(normalizeText('   ')).toBe('');
  });
  it('cuts the raw text before it trims', () => {
    expect(normalizeText(' '.repeat(8000) + 'x')).toBe('');
  });
  it('normalizeTerm trims, collapses, lower-cases and applies NFKC with no cap', () => {
    expect(normalizeTerm('  A   B ')).toBe('a b');
    expect(normalizeTerm(`${FULLWIDTH_LLM}\tTools`)).toBe('llm tools');
    expect(normalizeTerm('x'.repeat(9000))).toHaveLength(9000);
    expect(normalizeTerm('')).toBe('');
  });
});

describe('scoring thresholds', () => {
  it('sit at 0.80 and 0.55 with the minimum of four matches', () => {
    expect(config.thresholds).toEqual({ strong: 0.8, good: 0.55 });
    expect(config.minMatches).toBe(4);
    expect(config.maxChars).toBe(8000);
    expect(config.maxEvidenceRows).toBe(4);
    expect(config.maxTagsPerRow).toBe(8);
  });
  it('just under and just over each edge land in the right band', () => {
    expect(verdictFor(10, 0.805).verdict).toBe('Strong fit');
    expect(verdictFor(10, 0.795).verdict).toBe('Good fit, with gaps');
    expect(verdictFor(10, 0.5501).verdict).toBe('Good fit, with gaps');
    expect(verdictFor(10, 0.5499).verdict).toBe('Not a strong fit');
    expect(verdictFor(10, 0.545).verdict).toBe('Not a strong fit');
    expect(verdictFor(10, 0.5).verdict).toBe('Not a strong fit');
    expect(verdictFor(10, 0).verdict).toBe('Not a strong fit');
    expect(verdictFor(4, 0).verdict).toBe('Not a strong fit');
    expect(verdictFor(3, 0.9).verdict).toBe('Not enough to go on');
  });
  it('each band has its own style key', () => {
    expect(verdictFor(10, 1)).toEqual({ verdict: 'Strong fit', verdictKey: 'strong' });
    expect(verdictFor(10, 0.6)).toEqual({ verdict: 'Good fit, with gaps', verdictKey: 'good' });
    expect(verdictFor(10, 0.1)).toEqual({ verdict: 'Not a strong fit', verdictKey: 'weak' });
    expect(verdictFor(1, 1)).toEqual({ verdict: 'Not enough to go on', verdictKey: 'none' });
  });
  it('11 proven and 9 gaps (0.55) is a good fit; 11 and 10 (0.524) is not a strong fit', () => {
    const p = Array.from({ length: 11 }, (_, i) => skill(`p${i}`, 'shipped'));
    const g = Array.from({ length: 9 }, (_, i) => skill(`g${i}`, 'studied'));
    const all = [...p, ...g];
    expect(analyze(all.map((s) => s.name).join(' '), all, [], []).verdict).toBe(
      'Good fit, with gaps',
    );
    const more = [...all, skill('g9', 'studied')];
    expect(analyze(more.map((s) => s.name).join(' '), more, [], []).verdict).toBe(
      'Not a strong fit',
    );
  });
});

describe('role family', () => {
  const setOrder = (order: readonly RoleFamily[]): void => {
    (config as { roleTieOrder: readonly RoleFamily[] }).roleTieOrder = order;
  };
  const withOrder = (order: readonly RoleFamily[], run: () => void): void => {
    const saved = config.roleTieOrder;
    setOrder(order);
    try {
      run();
    } finally {
      setOrder(saved);
    }
  };
  it('an empty tie order falls back to ml', () => {
    withOrder([], () => {
      expect(analyze('', [], [], []).roleFamily).toBe('ml');
    });
  });
  it('with no match the first family in the tie order wins', () => {
    withOrder(['ds', 'ai', 'ml'], () => {
      expect(analyze('nothing here', [], [], []).roleFamily).toBe('ds');
    });
    withOrder(['ai', 'ds', 'ml'], () => {
      expect(analyze('nothing here', [], [], []).roleFamily).toBe('ai');
    });
  });
  it('a later family wins only with strictly more matches', () => {
    const s = [
      skill('a1', 'shipped', [], { roles: ['ai'] }),
      skill('d1', 'shipped', [], { roles: ['ds'] }),
      skill('d2', 'shipped', [], { roles: ['ds'] }),
    ];
    withOrder(['ml', 'ai', 'ds'], () => {
      expect(analyze('a1 d1', s, [], []).roleFamily).toBe('ai');
      expect(analyze('a1 d1 d2', s, [], []).roleFamily).toBe('ds');
    });
  });
  it('studied skills count toward the family too', () => {
    const s = [
      skill('a1', 'studied', [], { roles: ['ai'] }),
      skill('m1', 'shipped', [], { roles: ['ml'] }),
    ];
    withOrder(['ml', 'ai', 'ds'], () => {
      expect(analyze('a1', s, [], []).roleFamily).toBe('ai');
    });
  });
});

describe('evidence rows', () => {
  const items: EvidenceItem[] = [
    { id: 'one', name: 'One', proof: 'proof one' },
    { id: 'two', name: 'Two', proof: 'proof two', href: 'https://example.com/two' },
    {
      id: 'three',
      name: 'Three',
      proof: 'proof three',
      href: 'https://example.com/three',
      linkLabel: 'code',
    },
    { id: 'four', name: 'Four', proof: 'proof four', linkLabel: 'orphan label' },
  ];
  const s = [
    skill('s1', 'shipped', [], { evidence: ['one'] }),
    skill('s2', 'shipped', [], { evidence: ['two', 'three'] }),
    skill('s3', 'shipped', [], { evidence: ['three', 'four'] }),
    skill('s4', 'work', [], { evidence: ['three'] }),
  ];
  const rows = analyze('s1 s2 s3 s4', s, [], items).evidenceRows;

  it('ranks rows by matched skills, highest first', () => {
    expect(rows.map((r) => r.matchCount)).toEqual([3, 1, 1, 1]);
    expect(rows[0]?.id).toBe('three');
  });
  it('ranks a middle count between a high and a low one', () => {
    const it3: EvidenceItem[] = ['x', 'y', 'z'].map((id) => ({ id, name: id, proof: id }));
    const sk = [
      skill('k1', 'shipped', [], { evidence: ['x', 'y', 'z'] }),
      skill('k2', 'shipped', [], { evidence: ['y', 'z'] }),
      skill('k3', 'shipped', [], { evidence: ['z'] }),
    ];
    const r = analyze('k1 k2 k3', sk, [], it3).evidenceRows;
    expect(r.map((x) => [x.id, x.matchCount])).toEqual([
      ['z', 3],
      ['y', 2],
      ['x', 1],
    ]);
  });
  it('keeps list order among rows with equal counts', () => {
    expect(rows.slice(1).map((r) => r.id)).toEqual(['one', 'two', 'four']);
  });
  it('carries exactly the fields each item has', () => {
    expect(rows.find((r) => r.id === 'one')).toStrictEqual({
      id: 'one',
      name: 'One',
      proof: 'proof one',
      matchCount: 1,
      tags: ['s1'],
    });
    expect(rows.find((r) => r.id === 'two')).toStrictEqual({
      id: 'two',
      name: 'Two',
      proof: 'proof two',
      href: 'https://example.com/two',
      matchCount: 1,
      tags: ['s2'],
    });
    expect(rows.find((r) => r.id === 'three')).toStrictEqual({
      id: 'three',
      name: 'Three',
      proof: 'proof three',
      href: 'https://example.com/three',
      linkLabel: 'code',
      matchCount: 3,
      tags: ['s2', 's3', 's4'],
    });
    expect(rows.find((r) => r.id === 'four')).toStrictEqual({
      id: 'four',
      name: 'Four',
      proof: 'proof four',
      linkLabel: 'orphan label',
      matchCount: 1,
      tags: ['s3'],
    });
  });
  it('leaves out items no proven skill points to, and keeps the first four rows', () => {
    const six: EvidenceItem[] = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({
      id,
      name: id,
      proof: id,
    }));
    const sk = [skill('x', 'shipped', [], { evidence: ['a', 'b', 'c', 'd', 'e'] })];
    const r = analyze('x', sk, [], six).evidenceRows;
    expect(r.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(
      analyze('x', [skill('x', 'shipped', [], { evidence: ['f'] })], [], six).evidenceRows,
    ).toHaveLength(1);
    expect(
      analyze('x', [skill('x', 'shipped', [], { evidence: ['nope'] })], [], six).evidenceRows,
    ).toEqual([]);
  });
  it('cuts the tags of a row at eight, in skill order', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      skill(`t${i}`, 'shipped', [], { evidence: ['one'] }),
    );
    const r = analyze(many.map((x) => x.name).join(' '), many, [], items).evidenceRows[0];
    expect(r?.matchCount).toBe(10);
    expect(r?.tags).toEqual(['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7']);
  });
});

describe('extras and gaps', () => {
  it('de-duplicates an extra against skills and other extras whatever the letter case', () => {
    const s = [skill('Terraform', 'studied', ['tf'])];
    const ex: Extra[] = [
      { name: 'TERRAFORM', aliases: ['terraform'] },
      { name: 'Spark', aliases: ['sparkx'] },
      { name: 'SPARK', aliases: ['sparky'] },
      { name: 'spark', aliases: ['sparkz'] },
    ];
    const r = analyze('terraform sparkx sparky sparkz', s, ex, []);
    expect(r.gaps).toEqual(['Terraform', 'Spark']);
  });
  it('an extra never appears twice, and a skill match comes before extras', () => {
    const s = [skill('Zed', 'studied')];
    const r = analyze('java zed java', s, [{ name: 'Java', aliases: ['java'] }], []);
    expect(r.gaps).toEqual(['Zed', 'Java']);
    expect(r.gapCount).toBe(2);
  });
  it('an extra is a gap, never proven', () => {
    const r = analyze('swiftui', [], [{ name: 'Swift', aliases: ['swiftui'] }], []);
    expect(r.proven).toEqual([]);
    expect(r.gaps).toEqual(['Swift']);
  });
});
