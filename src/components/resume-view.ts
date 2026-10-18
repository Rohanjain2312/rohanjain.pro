// View model for the résumé sheet (design spec 12.1). One builder serves the dialog and the print route, so
// the PDF and the dialog cannot drift. Content comes from resume.json and projects.json (R-005, R-301).
import type { Resume } from '../lib/content/schemas.ts';
import { formatPhone } from './lib.ts';

export type RoleEntry = { id: string; title: string; summary: string; pdfFile: string };
export type ProjectName = { id: string; name: string; dateRange: string };
type Link = { label: string; url: string };

export type ResumeView = {
  name: string;
  /** "New York, NY · (240) 495-9682 · email" */
  contact: string;
  /** Profile URLs as link text: "linkedin.com/in/jaroh23". */
  profiles: { text: string; url: string }[];
  education: { school: string; degree: string; dateRange: string; details: string[] }[];
  skills: { label: string; text: string }[];
  experience: {
    company: string;
    where: string;
    title: string;
    dateRange: string;
    bullets: string[];
  }[];
  projects: { name: string; dateRange: string; links: Link[]; bullets: string[] }[];
  publication?: { citation: string; url?: string; text?: string };
};

/** "https://www.linkedin.com/in/jaroh23" becomes "linkedin.com/in/jaroh23". */
export function bareUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function buildResumeView(resume: Resume, projects: readonly ProjectName[]): ResumeView {
  const h = resume.header;
  return {
    name: h.name,
    contact: [h.location, formatPhone(h.phone), h.email].join(' · '),
    profiles: h.links.map((l) => ({ text: bareUrl(l.url), url: l.url })),
    education: resume.education.map((e) => ({ ...e })),
    skills: resume.skillGroups.map((g) => ({ label: g.label, text: g.skills.join(', ') })),
    experience: resume.experience.map((x) => ({
      company: x.company,
      where: x.location,
      title: x.title,
      dateRange: x.dateRange,
      bullets: x.bullets.map((b) => b.text),
    })),
    projects: resume.projects.map((p) => {
      const meta = projects.find((x) => x.id === p.projectId);
      if (!meta) throw new Error(`resume.json names unknown project "${p.projectId}".`);
      return {
        name: meta.name,
        dateRange: meta.dateRange,
        links: p.links ?? [],
        bullets: p.bullets.map((b) => b.text),
      };
    }),
    ...(resume.publication
      ? {
          publication: {
            citation: resume.publication.citation,
            ...(resume.publication.url
              ? { url: resume.publication.url, text: new URL(resume.publication.url).hostname }
              : {}),
          },
        }
      : {}),
  };
}
