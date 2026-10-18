// Zod schemas for every content file (docs/spec/06-architecture.md section 5.3).
// All objects are strict: unknown keys are rejected. For applications this is R-502.
import { z } from 'astro/zod';

const nonEmpty = z.string().trim().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const httpsUrl = z.url({ protocol: /^https$/, hostname: /.+/ });
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected kebab-case');

export const roleFamily = z.enum(['ai', 'ml', 'ds']);
export const tier = z.enum(['shipped', 'work', 'studied']);

export const claimSchema = z
  .object({
    id: slug,
    value: z.union([z.number(), nonEmpty]),
    display: nonEmpty,
    source: nonEmpty,
    sourceUrl: httpsUrl.optional(),
    verifiedOn: isoDate,
    note: nonEmpty.optional(),
  })
  .strict();
export const claimsSchema = z.array(claimSchema);

const linkSchema = z.object({ label: nonEmpty, url: httpsUrl }).strict();

export const projectSchema = z
  .object({
    id: slug,
    name: nonEmpty,
    dateRange: nonEmpty,
    featured: z.boolean(),
    order: z.number().int().nonnegative(),
    oneLiner: nonEmpty,
    headlineClaimId: slug,
    contextClaimIds: z.array(slug),
    links: z.array(linkSchema),
    demo: z
      .object({ url: httpsUrl, screenshot: nonEmpty.optional(), what: nonEmpty })
      .strict()
      .optional(),
    stack: z.array(nonEmpty),
  })
  .strict();
export const projectsSchema = z.array(projectSchema);

export const skillSchema = z
  .object({
    name: nonEmpty,
    category: nonEmpty,
    tier,
    evidence: z.array(nonEmpty),
    roles: z.array(roleFamily),
    aliases: z.array(nonEmpty),
  })
  .strict();
export const skillsSchema = z.array(skillSchema);

// Fit-check proof items (docs/spec/06-architecture.md section 5.4). The id is a project id or "goldman" / "ieee"
// and must match the ids in skills.json evidence[]. The proof line is built from the claims' display text, so
// no number lives here (R-301). A project item takes its name and link from projects.json; others state a name.
export const evidenceLinkKind = z.enum(['code', 'demo', 'model', 'write-up']);
export const evidenceItemSchema = z
  .object({
    id: slug,
    name: nonEmpty.optional(),
    proofClaimIds: z.array(slug).min(1),
    link: evidenceLinkKind.optional(),
  })
  .strict();
export const evidenceSchema = z.array(evidenceItemSchema);

export const roleSchema = z
  .object({ id: roleFamily, title: nonEmpty, summary: nonEmpty, pdfFile: nonEmpty })
  .strict();
export const rolesSchema = z.array(roleSchema);

export const figureSchema = z
  .object({
    id: slug,
    projectId: slug,
    kind: z.enum(['image', 'bars']),
    title: nonEmpty.optional(),
    src: nonEmpty.optional(),
    alt: nonEmpty,
    // The last bar is the strong one. display is the text shown for the value; axisMax is the full-width value.
    bars: z
      .array(
        z.object({ label: nonEmpty, value: z.number(), display: nonEmpty.optional() }).strict(),
      )
      .optional(),
    axisMax: z.number().positive().optional(),
    axisLabel: nonEmpty,
    caption: nonEmpty,
    note: nonEmpty,
    claimIds: z.array(slug),
  })
  .strict()
  .superRefine((f, ctx) => {
    if (f.kind === 'image' && !f.src)
      ctx.addIssue({ code: 'custom', path: ['src'], message: 'image figures need src' });
    if (f.kind === 'bars' && (!f.bars || f.bars.length === 0)) {
      ctx.addIssue({ code: 'custom', path: ['bars'], message: 'bars figures need bars' });
    }
  });
export const figuresSchema = z.array(figureSchema);

const bulletSchema = z.object({ text: nonEmpty, claimIds: z.array(slug) }).strict();

export const resumeSchema = z
  .object({
    header: z
      .object({
        name: nonEmpty,
        location: nonEmpty,
        email: z.email(),
        phone: nonEmpty,
        links: z.array(linkSchema),
      })
      .strict(),
    education: z.array(
      z
        .object({
          school: nonEmpty,
          degree: nonEmpty,
          dateRange: nonEmpty,
          details: z.array(nonEmpty),
        })
        .strict(),
    ),
    skillGroups: z.array(z.object({ label: nonEmpty, skills: z.array(nonEmpty) }).strict()),
    experience: z.array(
      z
        .object({
          company: nonEmpty,
          title: nonEmpty,
          location: nonEmpty,
          dateRange: nonEmpty,
          bullets: z.array(bulletSchema),
        })
        .strict(),
    ),
    projects: z.array(
      z
        .object({
          projectId: slug,
          links: z.array(linkSchema).optional(),
          bullets: z.array(bulletSchema),
        })
        .strict(),
    ),
    publication: z
      .object({ citation: nonEmpty, url: httpsUrl.optional(), claimIds: z.array(slug).optional() })
      .strict()
      .optional(),
  })
  .strict();

// Numerals that are not claims (R-301, ADR-0015): the 404 status code, decorative line numbers, ordinals.
export const claimsAllowlistSchema = z.array(
  z.object({ page: nonEmpty, number: nonEmpty, reason: nonEmpty }).strict(),
);

export const siteSchema = z
  .object({
    name: nonEmpty,
    location: nonEmpty,
    availability: nonEmpty,
    email: z.email(),
    phone: nonEmpty,
    profiles: z
      .object({ linkedin: httpsUrl, github: httpsUrl, huggingface: httpsUrl, medium: httpsUrl })
      .strict(),
    showPhoto: z.literal(false),
  })
  .strict();

// Application results live in src/lib/applications/schema.ts (R-502). Re-exported for the content collection.
export { applicationResultSchema as applicationSchema } from '../applications/schema.ts';

export type Claim = z.infer<typeof claimSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type EvidenceRecord = z.infer<typeof evidenceItemSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Figure = z.infer<typeof figureSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type Site = z.infer<typeof siteSchema>;
export type { ApplicationResult as Application } from '../applications/schema.ts';
