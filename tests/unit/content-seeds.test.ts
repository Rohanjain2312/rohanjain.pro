import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadRawContent } from '../../src/lib/content/load.ts';
import { validateContent } from '../../src/lib/content/validate.ts';
import { figuresSchema, projectsSchema } from '../../src/lib/content/schemas.ts';
import { buildClaimIndex, checkHtml } from '../../src/lib/claims/check.ts';

const raw = loadRawContent('src/content', {});
const projects = projectsSchema.parse(raw.projects);
const figures = figuresSchema.parse(raw.figures);
const claims = raw.claims as { id: string; value: number | string; display: string }[];

describe('seeded content', () => {
  it('passes cross-file validation', () => {
    expect(validateContent(raw)).toEqual([]);
  });
  it('has 4 featured and 5 more projects with unique order', () => {
    expect(projects.filter((p) => p.featured)).toHaveLength(4);
    expect(projects.filter((p) => !p.featured)).toHaveLength(5);
    expect(new Set(projects.map((p) => p.order)).size).toBe(projects.length);
  });
  it('has 6 image and 4 bar figures', () => {
    expect(figures.filter((f) => f.kind === 'image')).toHaveLength(6);
    expect(figures.filter((f) => f.kind === 'bars')).toHaveLength(4);
  });
  it('points every image figure at a real file', () => {
    for (const f of figures.filter((x) => x.kind === 'image'))
      expect(existsSync(f.src!), f.id).toBe(true);
  });
  it('keeps bar values within the axis', () => {
    for (const f of figures.filter((x) => x.kind === 'bars')) {
      expect(f.axisMax, f.id).toBeDefined();
      for (const b of f.bars!) expect(b.value).toBeLessThanOrEqual(f.axisMax!);
    }
  });
  it('maps every number in project and figure text to a claim (R-301)', () => {
    const index = buildClaimIndex(claims);
    const strings = [
      ...projects.flatMap((p) => [p.oneLiner, p.name, ...p.stack, p.demo?.what ?? '']),
      ...figures.flatMap((f) => [
        f.alt,
        f.caption,
        f.note,
        f.axisLabel,
        f.title ?? '',
        ...(f.bars ?? []).map((b) => `${b.label} ${b.display ?? b.value} ${f.axisLabel}`),
      ]),
    ];
    for (const s of strings) expect(checkHtml('/', `<p>${s}</p>`, index), s).toEqual([]);
  });
});
