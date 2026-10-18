// Design spec 13.2: an SVG cannot read CSS custom properties, so the favicon and brand SVGs carry token
// values as literals. Every hex value in them must equal a token in tokens.css.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Test-only reads of fixed repo paths.
/* eslint-disable security/detect-non-literal-fs-filename */

const hex = (s: string) => (s.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((h) => h.toLowerCase());
const tokens = new Set(hex(readFileSync('src/styles/tokens.css', 'utf8')));

const brandDir = 'src/assets/brand';
const svgs = [
  'public/favicon.svg',
  ...(existsSync(brandDir)
    ? readdirSync(brandDir)
        .filter((f) => f.endsWith('.svg'))
        .map((f) => join(brandDir, f))
    : []),
].filter((f) => existsSync(f));

describe('brand SVG colors', () => {
  it('has token colors to compare against, and the favicon is checked', () => {
    expect(tokens.size).toBeGreaterThan(0);
    expect(svgs).toContain('public/favicon.svg');
  });
  it.each(svgs)('%s uses only token colors', (file) => {
    const found = hex(readFileSync(file, 'utf8'));
    expect(found.length).toBeGreaterThan(0);
    for (const h of found) expect(tokens, `${file}: ${h}`).toContain(h);
  });
});
