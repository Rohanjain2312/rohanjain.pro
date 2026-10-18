// Builds the fit-check evidence items from evidence.json, projects.json and claims.json. Pure.
import type { EvidenceItem } from '../fitcheck/types.ts';
import { evidenceSchema, projectsSchema, claimsSchema } from './schemas.ts';
import type { EvidenceRecord, Project } from './schemas.ts';

export const LINK_LABELS = {
  code: 'code',
  demo: 'live demo',
  model: 'model',
  'write-up': 'write-up',
} as const;

/** The URL a project offers for a link kind, or undefined. "demo" is the demo URL or a link labeled demo. */
export function projectLinkUrl(
  project: Pick<Project, 'links'> & { demo?: { url: string } | undefined },
  kind: EvidenceRecord['link'],
): string | undefined {
  if (!kind) return undefined;
  if (kind === 'demo') {
    return project.demo?.url ?? project.links.find((l) => l.label === 'demo')?.url;
  }
  return project.links.find((l) => l.label === kind)?.url;
}

export class EvidenceError extends Error {}

/** Parse the three raw files and return the items in file order. Throws EvidenceError on any broken reference. */
export function buildEvidence(
  rawEvidence: unknown,
  rawProjects: unknown,
  rawClaims: unknown,
): EvidenceItem[] {
  const records = evidenceSchema.parse(rawEvidence);
  const projects = new Map(projectsSchema.parse(rawProjects).map((p) => [p.id, p]));
  const claims = new Map(claimsSchema.parse(rawClaims).map((c) => [c.id, c]));
  return records.map((r) => {
    const project = projects.get(r.id);
    const name = project?.name ?? r.name;
    if (!name) throw new EvidenceError(`evidence "${r.id}" needs a name`);
    const proof = r.proofClaimIds
      .map((id) => {
        const claim = claims.get(id);
        if (!claim) throw new EvidenceError(`evidence "${r.id}": unknown claim ID "${id}"`);
        return claim.display;
      })
      .join(', ');
    const item: EvidenceItem = { id: r.id, name, proof };
    if (r.link) {
      const href = project ? projectLinkUrl(project, r.link) : undefined;
      if (!href) throw new EvidenceError(`evidence "${r.id}": no "${r.link}" link on the project`);
      item.href = href;
      item.linkLabel = LINK_LABELS[r.link];
    }
    return item;
  });
}
