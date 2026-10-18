// Head metadata helpers (F-12): the JSON-LD Person block and which brand files exist. Every value in the
// Person block comes from site.json, resume.json or home.json; nothing is typed here (R-005).
/* eslint-disable security/detect-non-literal-fs-filename -- Build-time check of fixed file names under public/. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Resume, Site } from '../lib/content/schemas.ts';

/** The public origin, set in one place. astro.config.mjs is Platform-owned, so Astro.site is not used. */
export const SITE_ORIGIN = 'https://rohanjain.pro';
export const OG_ALT = 'Rohan Jain, ML and AI Engineer';

/** Public brand files (design spec 13). A tag is emitted only when its file is in public/. */
export function brandFiles(root: string = process.cwd()) {
  const has = (f: string) => existsSync(join(root, 'public', f));
  return {
    ogImage: has('og.png') ? '/og.png' : undefined,
    faviconSvg: has('favicon.svg') ? '/favicon.svg' : undefined,
    faviconIco: has('favicon.ico') ? '/favicon.ico' : undefined,
    appleIcon: has('favicon-180.png') ? '/favicon-180.png' : undefined,
  };
}

/** "New York, NY" to a PostalAddress. */
function address(location: string) {
  const [city, region] = location.split(',').map((s) => s.trim());
  return {
    '@type': 'PostalAddress',
    ...(city ? { addressLocality: city } : {}),
    ...(region ? { addressRegion: region } : {}),
  };
}

export function personJsonLd(args: {
  site: Site;
  resume: Resume;
  origin: string;
  jobTitle: string;
  description: string;
}) {
  const { site, resume, origin, jobTitle, description } = args;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: origin,
    jobTitle,
    description,
    email: site.email,
    telephone: site.phone,
    address: address(site.location),
    alumniOf: resume.education.map((e) => ({
      '@type': 'CollegeOrUniversity',
      name: e.school.split(',')[0] ?? e.school,
    })),
    sameAs: Object.values(site.profiles),
  };
}

/** JSON for an inline ld+json script. "<" is escaped so the data can never close the script element. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
