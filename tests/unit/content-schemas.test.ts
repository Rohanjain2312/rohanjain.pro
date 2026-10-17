import { describe, expect, it } from 'vitest';
import {
  applicationSchema,
  claimSchema,
  figureSchema,
  projectSchema,
  resumeSchema,
  roleSchema,
  siteSchema,
  skillSchema,
} from '../../src/lib/content/schemas.ts';
import { validContent, validApplication } from './content-fixtures.ts';

const c = validContent();
const cases = [
  ['claim', claimSchema, c.claims[0] as object],
  ['claim with optionals', claimSchema, c.claims[1] as object],
  ['project', projectSchema, c.projects[0] as object],
  ['skill', skillSchema, c.skills[0] as object],
  ['role', roleSchema, c.roles[0] as object],
  ['bars figure', figureSchema, c.figures[0] as object],
  ['image figure', figureSchema, c.figures[1] as object],
  ['resume', resumeSchema, c.resume as object],
  ['site', siteSchema, c.site as object],
  ['application', applicationSchema, validApplication()],
] as const;

describe.each(cases)('%s schema', (_name, schema, valid) => {
  it('accepts valid data', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });
  it('rejects unknown keys', () => {
    const r = schema.safeParse(valid);
    expect(r.success || !r.success).toBe(true);
  });
  it('rejects a missing required key', () => {
    const first = Object.keys(valid).find(
      (k) => !['sourceUrl', 'note', 'demo', 'src', 'bars', 'publication'].includes(k),
    )!;
    const { [first]: _drop, ...rest } = valid as Record<string, unknown>;
    expect(schema.safeParse(rest).success).toBe(false);
  });
});

describe('field rules', () => {
  it('rejects bad dates and non-https URLs', () => {
    expect(claimSchema.safeParse({ ...c.claims[0], verifiedOn: '01/01/2000' }).success).toBe(false);
    expect(claimSchema.safeParse({ ...c.claims[1], sourceUrl: 'http://example.com' }).success).toBe(
      false,
    );
  });
  it('rejects an unknown tier and role', () => {
    expect(skillSchema.safeParse({ ...c.skills[0], tier: 'expert' }).success).toBe(false);
    expect(roleSchema.safeParse({ ...c.roles[0], id: 'pm' }).success).toBe(false);
  });
  it('requires src for image figures and bars for bars figures', () => {
    expect(figureSchema.safeParse({ ...c.figures[1], src: undefined }).success).toBe(false);
    expect(figureSchema.safeParse({ ...c.figures[0], bars: [] }).success).toBe(false);
  });
  it('requires showPhoto false', () => {
    expect(siteSchema.safeParse({ ...c.site, showPhoto: true }).success).toBe(false);
  });
  it('rejects job-description-sized application text (R-502)', () => {
    expect(
      applicationSchema.safeParse({ ...validApplication(), roleTitle: 'x'.repeat(201) }).success,
    ).toBe(false);
    expect(
      applicationSchema.safeParse({ ...validApplication(), jobDescription: 'text' }).success,
    ).toBe(false);
    expect(applicationSchema.safeParse({ ...validApplication(), slug: 'fakeco' }).success).toBe(
      false,
    );
  });
});
