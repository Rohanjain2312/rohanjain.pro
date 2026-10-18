// Result schema for one /for application (docs/spec/06-architecture.md section 5.5, ADR-0016).
// The file holds the engine's curated output plus the company and role the client typed.
// It is strict and every string is bounded, so job description text cannot be stored (R-502).
import { z } from 'astro/zod';

const shortText = z.string().trim().min(1).max(200);
const proofText = z.string().trim().min(1).max(600);
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'not a real date');
const httpsUrl = z.url({ protocol: /^https$/, hostname: /.+/ }).max(300);

/** `<company-kebab>-<6 base32 chars>`. The slug is the file name, not a field in the file. */
// Linear: fixed delimiters between groups, so the unsafe-regex heuristic is a false positive.
// eslint-disable-next-line security/detect-unsafe-regex
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*-[a-z2-7]{6}$/;

export const applicationVerdictLabel = z.enum([
  'Strong fit',
  'Good fit, with gaps',
  'Not a strong fit',
  'Not enough to go on',
]);
export const applicationVerdictKey = z.enum(['strong', 'good', 'weak', 'none']);

export const applicationEvidenceRowSchema = z
  .object({
    id: shortText,
    name: shortText,
    proof: proofText,
    href: httpsUrl.optional(),
    linkLabel: shortText.optional(),
    matchCount: z.number().int().nonnegative().max(1000),
    tags: z.array(shortText).max(8),
  })
  .strict();

export const applicationResultSchema = z
  .object({
    company: shortText,
    role: shortText,
    created: isoDate,
    expires: isoDate,
    verdict: z.object({ label: applicationVerdictLabel, key: applicationVerdictKey }).strict(),
    counts: z
      .object({
        proven: z.number().int().nonnegative().max(1000),
        gaps: z.number().int().nonnegative().max(1000),
      })
      .strict(),
    evidenceRows: z.array(applicationEvidenceRowSchema).max(4),
    gaps: z.array(shortText).max(100),
  })
  .strict()
  .refine((r) => r.expires > r.created, {
    message: 'expires must be after created',
    path: ['expires'],
  });

export type ApplicationResult = z.infer<typeof applicationResultSchema>;
