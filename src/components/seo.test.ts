import { describe, expect, it } from 'vitest';
import { jsonLdText, personJsonLd } from './seo.ts';
import site from '../content/site.json';
import resume from '../content/resume.json';
import type { Resume, Site } from '../lib/content/schemas.ts';

describe('personJsonLd', () => {
  const person = personJsonLd({
    site: site as Site,
    resume: resume as unknown as Resume,
    origin: 'https://example.test',
    jobTitle: 'Role',
    description: 'Text',
  });
  it('takes every field from content', () => {
    expect(person.name).toBe(site.name);
    expect(person.email).toBe(site.email);
    expect(person.sameAs).toEqual(Object.values(site.profiles));
    expect(person.address.addressLocality).toBe('New York');
    expect(person.address.addressRegion).toBe('NY');
    expect(person.alumniOf.map((a) => a.name)).toEqual([
      'University of Maryland',
      'PES University',
    ]);
  });
});

describe('phone number (R-305)', () => {
  it('is absent from the JSON-LD', () => {
    const person = personJsonLd({
      site: site as Site,
      resume: resume as unknown as Resume,
      origin: 'https://example.test',
      jobTitle: 'Role',
      description: 'Text',
    });
    expect(person).not.toHaveProperty('telephone');
    expect(jsonLdText(person)).not.toMatch(/telephone/i);
  });
});

describe('jsonLdText', () => {
  it('cannot close the script element', () => {
    const text = jsonLdText({ a: '</script><script>x' });
    expect(text).not.toContain('<');
    expect(JSON.parse(text).a).toBe('</script><script>x');
  });
});
