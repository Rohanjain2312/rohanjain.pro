import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalPath, headersFor, lookupFile, parseHeaders } from '../../scripts/preview.mjs';

const fixture = `# fixture
/*
  X-Test: all
  X-Frame-Options: DENY

/for/*
  X-Robots-Tag: noindex
  Cache-Control: no-store

/print/*
  X-Robots-Tag: nofollow
  X-Test: print
`;
const rules = parseHeaders(fixture);
const get = (p: string) => Object.fromEntries(headersFor(rules, p));

describe('_headers parser', () => {
  it('parses patterns and headers, skipping comments', () => {
    expect(rules.map((r) => r.pattern)).toEqual(['/*', '/for/*', '/print/*']);
    expect(rules[0]?.headers).toHaveLength(2);
  });
  it('applies the catch-all to every route', () => {
    expect(get('/')['X-Frame-Options']).toBe('DENY');
  });
  it('adds splat rules for /for/x', () => {
    expect(get('/for/x')['Cache-Control']).toBe('no-store');
    expect(get('/for/x')['X-Robots-Tag']).toBe('noindex');
  });
  it('does not leak /for rules to /print/x', () => {
    expect(get('/print/x')['Cache-Control']).toBeUndefined();
    expect(get('/print/x')['X-Robots-Tag']).toBe('nofollow');
  });
  it('joins repeated header names', () => {
    expect(get('/print/x')['X-Test']).toBe('all, print');
  });
  it('supports placeholders', () => {
    const r = parseHeaders('/a/:id/b\n  X-P: 1\n');
    expect(headersFor(r, '/a/9/b')).toEqual([['X-P', '1']]);
    expect(headersFor(r, '/a/b')).toEqual([]);
  });
});

describe('canonical path (120-L1)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pv-'));
  mkdirSync(join(dir, 'for', 'x'), { recursive: true });
  writeFileSync(join(dir, 'for', 'x', 'index.html'), 'x');

  it('decodes once so encoded letters get the /for headers', () => {
    const c = canonicalPath('/%66or/x');
    expect(c).toBe('/for/x');
    expect(Object.fromEntries(headersFor(rules, c ?? ''))['Cache-Control']).toBe('no-store');
    expect(canonicalPath('/%70rint/x')).toBe('/print/x');
  });
  it('rejects encoded slashes, backslashes, NUL, traversal and bad escapes', () => {
    for (const p of ['/for%2fx', '/for%2Fx', '/for%5cx', '/a%00', '/%2e%2e/x', '/%zz', '/..%2f']) {
      expect(canonicalPath(p)).toBeNull();
    }
    expect(canonicalPath('/a/../../x')).toBeNull();
  });
  it('looks files up case-sensitively', () => {
    expect(lookupFile(dir, '/for/x')).toBe(join(dir, 'for', 'x', 'index.html'));
    expect(lookupFile(dir, '/FOR/x')).toBeNull();
    expect(lookupFile(dir, '/for/X')).toBeNull();
  });
});
