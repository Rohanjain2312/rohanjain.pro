import { describe, expect, it } from 'vitest';
import { headersFor, parseHeaders } from '../../scripts/preview.mjs';

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
