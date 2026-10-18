import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const fonts = 'public/fonts';

// Test-only reads of fixed repo paths.
/* eslint-disable security/detect-non-literal-fs-filename */

describe('fonts', () => {
  const files = readdirSync(fonts).filter((f) => f.endsWith('.woff2'));
  it('total under 120 KB', () => {
    const total = files.reduce((n, f) => n + statSync(join(fonts, f)).size, 0);
    expect(total).toBeLessThan(120 * 1000);
  });
  it('use font-display swap on every face and no remote or data urls', () => {
    const text = readFileSync('src/styles/fonts.css', 'utf8');
    const faces = text.match(/@font-face\s*{[^}]*}/g) ?? [];
    const web = faces.filter((f) => f.includes('/fonts/'));
    expect(web).toHaveLength(files.length);
    for (const f of web) expect(f).toContain('font-display: swap');
    expect(text).not.toMatch(/https?:|data:/);
  });
});

describe('base and print styles', () => {
  it('write no color literals', () => {
    for (const f of ['src/styles/base.css', 'src/styles/print.css']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    }
  });
});

// The one inline script allowed: JSON-LD data (public/_headers, F-12).
const JSON_LD = 'JsonLd.astro';

describe('layout and page', () => {
  it('avoid constructs that need CSP exceptions', () => {
    for (const f of ['src/layouts/Base.astro', 'src/pages/index.astro']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(
        /define:vars|is:inline|set:html|style=|<script/,
      );
    }
  });
  it('keep styles out of .astro files and scripts bundled', () => {
    const dirs = ['src/components', 'src/layouts', 'src/pages'];
    for (const d of dirs) {
      for (const f of readdirSync(d).filter((n) => n.endsWith('.astro') && n !== JSON_LD)) {
        const text = readFileSync(join(d, f), 'utf8');
        expect(text, f).not.toMatch(/<style|define:vars|is:inline|set:html|\sstyle=/);
      }
    }
  });
  it('allow set:html only in the JSON-LD component, for one ld+json script', () => {
    const text = readFileSync(`src/components/${JSON_LD}`, 'utf8');
    const body = text.slice(text.indexOf('\n---', 4) + 4);
    expect(body.match(/<script[^>]*>/g)).toEqual([
      '<script type="application/ld+json" set:html={text} />',
    ]);
    expect(body).not.toMatch(/<style|define:vars|is:inline|\sstyle=/);
  });
});

/* eslint-enable security/detect-non-literal-fs-filename */
