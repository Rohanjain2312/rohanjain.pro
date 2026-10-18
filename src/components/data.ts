// Loads content for the pages from the Astro collections (src/content.config.ts) and derives what the
// components need. Everything shown on a page starts here or in src/components/copy/*.json.
import { getCollection, getEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import type { Claim, Figure, Project, Resume, Site } from '../lib/content/schemas.ts';
import figureOrder from '../content/figures.json';
import roleOrder from '../content/roles.json';
import type { RoleEntry } from './resume-view.ts';
import {
  claimMap,
  claimOf,
  compareStart,
  fill,
  startOf,
  yearSpan,
  type ClaimMap,
  type Start,
} from './lib.ts';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/figures/*.png', {
  eager: true,
});

export type ProjectView = {
  id: string;
  name: string;
  dateRange: string;
  start: Start;
  featured: boolean;
  oneLiner: string;
  headline: string;
  context: string[];
  links: { label: string; url: string }[];
  demo?: { url: string; what: string } | undefined;
};

export type FigureView = {
  id: string;
  projectId: string;
  kind: 'image' | 'bars';
  title: string;
  date: string;
  dateIso: string;
  alt: string;
  image?: ImageMetadata | undefined;
  bars?: { label: string; value: number; display: string }[] | undefined;
  axisMax?: number | undefined;
  axisLabel: string;
  caption: string;
  note: string;
};

export type TimelineEntry = {
  key: string;
  start: Start;
  label: string;
  /** Present for project entries: the project and its first figure, which the entry links to. */
  projectId?: string;
  figureId?: string;
};

export async function loadSite() {
  const claimList = (await getCollection('claims')).map((e) => e.data as Claim);
  const claims: ClaimMap = claimMap(claimList);
  const site = (await getEntry('site', 'site'))?.data as Site | undefined;
  const resume = (await getEntry('resume', 'resume'))?.data as Resume | undefined;
  if (!site) throw new Error('src/content/site.json is missing.');
  if (!resume) throw new Error('src/content/resume.json is missing.');

  const projects: ProjectView[] = (await getCollection('projects'))
    .map((e) => e.data as Project)
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.id,
      name: p.name,
      dateRange: p.dateRange,
      start: startOf(p.dateRange),
      featured: p.featured,
      oneLiner: p.oneLiner,
      headline: claimOf(claims, p.headlineClaimId).display,
      context: p.contextClaimIds.map((id) => claimOf(claims, id).display),
      links: p.links,
      demo: p.demo ? { url: p.demo.url, what: p.demo.what } : undefined,
    }));
  const byId = new Map(projects.map((p) => [p.id, p]));

  // Collections come back sorted by id; the page keeps the order of figures.json.
  const order = figureOrder.map((f) => f.id);
  const figures: FigureView[] = (await getCollection('figures'))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    .map((e) => {
      const f = e.data as Figure;
      const project = byId.get(f.projectId);
      if (!project) throw new Error(`Figure "${f.id}" names unknown project "${f.projectId}".`);
      let image: ImageMetadata | undefined;
      if (f.kind === 'image') {
        const file = (f.src ?? '').split('/').pop() ?? '';
        image = images[`../assets/figures/${file}`]?.default;
        if (!image) throw new Error(`Figure "${f.id}": no image ${file} in src/assets/figures/.`);
      }
      return {
        id: f.id,
        projectId: f.projectId,
        kind: f.kind,
        title: f.title ?? project.name,
        date: project.start.label,
        dateIso: project.start.iso,
        alt: f.alt,
        image,
        bars: f.bars?.map((b) => ({
          label: b.label,
          value: b.value,
          display: b.display ?? String(b.value),
        })),
        axisMax: f.axisMax,
        axisLabel: f.axisLabel,
        caption: f.caption,
        note: f.note,
      };
    });

  return { claims, site, resume, projects, figures };
}

/** Roles in the order of roles.json (AI Engineer, ML Engineer, Data Scientist); collections come back sorted by id. */
export async function loadRoles(): Promise<RoleEntry[]> {
  const order = roleOrder.map((r) => r.id);
  return (await getCollection('roles'))
    .map((e) => e.data as RoleEntry)
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

type Loaded = Awaited<ReturnType<typeof loadSite>>;
type PlainEntry = { claimId: string; label: string };

/** Timeline: dated entries from claims for the career steps, one entry per project that has figures, oldest first. */
export function buildTimeline(data: Loaded, plain: PlainEntry[]): TimelineEntry[] {
  const entries: TimelineEntry[] = plain.map((p) => {
    const c = claimOf(data.claims, p.claimId);
    return { key: p.claimId, start: startOf(String(c.value)), label: p.label };
  });
  // The career steps show a year only; the claim holds the full range.
  for (const e of entries)
    e.start = { ...e.start, month: 0, label: String(e.start.year), iso: String(e.start.year) };
  const seen = new Set<string>();
  for (const f of data.figures) {
    if (seen.has(f.projectId)) continue;
    seen.add(f.projectId);
    const p = data.projects.find((x) => x.id === f.projectId);
    if (!p) continue;
    entries.push({
      key: p.id,
      start: p.start,
      label: p.name,
      projectId: p.id,
      figureId: f.id,
    });
  }
  return entries.sort((a, b) => compareStart(a.start, b.start));
}

export { fill, yearSpan };
