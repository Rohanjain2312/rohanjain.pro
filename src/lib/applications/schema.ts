// Result schema for one /for application (docs/spec/06-architecture.md section 5.5, ADR-0016).
// The file holds the engine's curated output plus the company and role the client typed.
// It is strict and every string is bounded, so job description text cannot be stored (R-502).
import { z } from 'astro/zod';

const shortText = z.string().trim().min(1).max(200);
const proofText = z.string().trim().min(1).max(600);
// z.iso.date() checks the calendar: it rejects 2000-13-45 and 2000-02-30.
const isoDate = z.iso.date('expected a real date as YYYY-MM-DD');
/** Skill names, tags and gaps. Short on purpose: no room to store job description text. */
const itemText = z.string().trim().min(1).max(80);
/** Most entries any list in a result may hold. */
export const MAX_LIST_ENTRIES = 30;
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
    id: itemText,
    name: itemText,
    proof: proofText,
    href: httpsUrl.optional(),
    linkLabel: shortText.optional(),
    matchCount: z.number().int().nonnegative().max(1000),
    tags: z.array(itemText).max(8),
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
    gaps: z.array(itemText).max(MAX_LIST_ENTRIES),
  })
  .strict()
  .refine((r) => r.expires > r.created, {
    message: 'expires must be after created',
    path: ['expires'],
  });

export type ApplicationResult = z.infer<typeof applicationResultSchema>;
