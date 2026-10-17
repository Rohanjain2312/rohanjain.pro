// Parses content files and checks references across them. Pure: callers pass raw JSON.
import type { ZodType } from 'astro/zod';
import {
  applicationSchema,
  claimsSchema,
  figuresSchema,
  projectsSchema,
  resumeSchema,
  rolesSchema,
  siteSchema,
  skillsSchema,
} from './schemas.ts';

export type RawContent = {
  claims?: unknown;
  projects?: unknown;
  skills?: unknown;
  roles?: unknown;
  figures?: unknown;
  resume?: unknown;
  site?: unknown;
  /** File name (for example "acme-abc234.json") to parsed JSON. */
  applications?: Record<string, unknown>;
};

// Evidence that is not a project on the site: the Goldman Sachs role and the IEEE paper.
const EVIDENCE_SOURCES = new Set(['goldman', 'ieee']);

export type Problem = { file: string; field: string; message: string };

// Shapes of parsed records after schema validation. Only the fields this module reads are listed.
type Claim = { id: string };
type Project = { id: string; headlineClaimId: string; contextClaimIds: string[] };
type Skill = { name: string; evidence: string[] };
type Figure = { id: string; projectId: string; claimIds: string[] };
type Bullet = { claimIds: string[] };
type Resume = {
  experience: { bullets: Bullet[] }[];
  publication?: { claimIds?: string[] };
  projects: { projectId: string; bullets: Bullet[] }[];
};
type Application = {
  slug: string;
  createdOn: string;
  expiresOn: string;
  evidenceRows: { claimIds: string[] }[];
};

const fmt = (path: PropertyKey[]): string => (path.length ? path.map(String).join('.') : '(root)');

function parse<T>(file: string, schema: ZodType, data: unknown, out: Problem[]): T | undefined {
  if (data === undefined) return undefined;
  const r = schema.safeParse(data);
  if (r.success) return r.data as T;
  for (const i of r.error.issues) out.push({ file, field: fmt(i.path), message: i.message });
  return undefined;
}

export function validateContent(raw: RawContent): Problem[] {
  const out: Problem[] = [];
  const claims = parse<Claim[]>('claims.json', claimsSchema, raw.claims, out);
  const projects = parse<Project[]>('projects.json', projectsSchema, raw.projects, out);
  const skills = parse<Skill[]>('skills.json', skillsSchema, raw.skills, out);
  parse('roles.json', rolesSchema, raw.roles, out);
  const figures = parse<Figure[]>('figures.json', figuresSchema, raw.figures, out);
  const resume = parse<Resume>('resume.json', resumeSchema, raw.resume, out);
  parse('site.json', siteSchema, raw.site, out);
  const apps: [string, Application][] = [];
  for (const [name, data] of Object.entries(raw.applications ?? {})) {
    const a = parse<Application>(`applications/${name}`, applicationSchema, data, out);
    if (a) apps.push([name, a]);
  }

  const dupes = (file: string, field: string, ids: string[]) => {
    const seen = new Set<string>();
    ids.forEach((id, i) => {
      if (seen.has(id))
        out.push({ file, field: `${i}.${field}`, message: `duplicate ${field} "${id}"` });
      seen.add(id);
    });
  };
  if (claims)
    dupes(
      'claims.json',
      'id',
      claims.map((c) => c.id),
    );
  if (projects)
    dupes(
      'projects.json',
      'id',
      projects.map((p) => p.id),
    );
  if (skills)
    dupes(
      'skills.json',
      'name',
      skills.map((s) => s.name),
    );
  if (figures)
    dupes(
      'figures.json',
      'id',
      figures.map((f) => f.id),
    );

  const claimIds = claims ? new Set<string>(claims.map((c) => c.id)) : undefined;
  const projectIds = projects ? new Set<string>(projects.map((p) => p.id)) : undefined;
  const claimRef = (file: string, field: string, id: string) => {
    if (claimIds && !claimIds.has(id))
      out.push({ file, field, message: `unknown claim ID "${id}"` });
  };
  const projectRef = (file: string, field: string, id: string) => {
    if (projectIds && !projectIds.has(id))
      out.push({ file, field, message: `unknown project ID "${id}"` });
  };
  const claimRefs = (file: string, base: string, ids: string[]) =>
    ids.forEach((id, i) => claimRef(file, `${base}.${i}`, id));

  projects?.forEach((p, i) => {
    claimRef('projects.json', `${i}.headlineClaimId`, p.headlineClaimId);
    claimRefs('projects.json', `${i}.contextClaimIds`, p.contextClaimIds);
  });
  figures?.forEach((f, i) => {
    projectRef('figures.json', `${i}.projectId`, f.projectId);
    claimRefs('figures.json', `${i}.claimIds`, f.claimIds);
  });
  // Skill evidence entries are claim IDs or project IDs.
  if (claimIds && projectIds) {
    skills?.forEach((s, i) =>
      s.evidence.forEach((id, j) => {
        if (!claimIds.has(id) && !projectIds.has(id) && !EVIDENCE_SOURCES.has(id)) {
          out.push({
            file: 'skills.json',
            field: `${i}.evidence.${j}`,
            message: `evidence "${id}" is not a claim or project ID`,
          });
        }
      }),
    );
  }
  if (resume) {
    resume.experience.forEach((e, i) =>
      e.bullets.forEach((b, j) =>
        claimRefs('resume.json', `experience.${i}.bullets.${j}.claimIds`, b.claimIds),
      ),
    );
    claimRefs('resume.json', 'publication.claimIds', resume.publication?.claimIds ?? []);
    resume.projects.forEach((p, i) => {
      projectRef('resume.json', `projects.${i}.projectId`, p.projectId);
      p.bullets.forEach((b, j) =>
        claimRefs('resume.json', `projects.${i}.bullets.${j}.claimIds`, b.claimIds),
      );
    });
  }
  for (const [name, a] of apps) {
    const file = `applications/${name}`;
    if (name !== `${a.slug}.json`)
      out.push({ file, field: 'slug', message: `slug "${a.slug}" does not match file name` });
    if (a.expiresOn <= a.createdOn)
      out.push({ file, field: 'expiresOn', message: 'expiresOn must be after createdOn' });
    a.evidenceRows.forEach((r, i) => claimRefs(file, `evidenceRows.${i}.claimIds`, r.claimIds));
  }
  return out;
}
