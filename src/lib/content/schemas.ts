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
    demo: z.object({ url: httpsUrl, screenshot: nonEmpty }).strict().optional(),
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

export const roleSchema = z
  .object({ id: roleFamily, title: nonEmpty, summary: nonEmpty, pdfFile: nonEmpty })
  .strict();
export const rolesSchema = z.array(roleSchema);

export const figureSchema = z
  .object({
    id: slug,
    projectId: slug,
    kind: z.enum(['image', 'bars']),
    src: nonEmpty.optional(),
    alt: nonEmpty,
    bars: z.array(z.object({ label: nonEmpty, value: z.number() }).strict()).optional(),
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
    projects: z.array(z.object({ projectId: slug, bullets: z.array(bulletSchema) }).strict()),
    publication: z.object({ citation: nonEmpty, url: httpsUrl.optional() }).strict().optional(),
  })
  .strict();

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

// Never contains job description text (R-502): strict keys and short bounded strings.
const shortText = z.string().trim().min(1).max(200);
export const applicationSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*-[a-z2-7]{6}$/, 'expected <company-kebab>-<6 base32 chars>'),
    company: shortText,
    roleTitle: shortText,
    createdOn: isoDate,
    expiresOn: isoDate,
    verdict: z.enum([
      'Strong fit',
      'Good fit, with gaps',
      'Not a strong fit',
      'Not enough to go on',
    ]),
    provenSkills: z.array(shortText).max(100),
    gaps: z.array(shortText).max(100),
    evidenceRows: z
      .array(
        z
          .object({
            title: shortText,
            claimIds: z.array(slug).max(20),
            tags: z.array(shortText).max(8),
          })
          .strict(),
      )
      .max(4),
    roleFamily,
  })
  .strict();

export type Claim = z.infer<typeof claimSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Figure = z.infer<typeof figureSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type Site = z.infer<typeof siteSchema>;
export type Application = z.infer<typeof applicationSchema>;
