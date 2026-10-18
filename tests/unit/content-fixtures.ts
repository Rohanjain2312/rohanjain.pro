// Clearly fake values for schema tests. Not real content (R-005).
import type { RawContent } from '../../src/lib/content/validate.ts';

export const link = { label: 'Fake repo', url: 'https://example.com/fake' };

export function validContent(): { [K in keyof RawContent]-?: any } {
  return {
    claims: [
      {
        id: 'fake-claim-a',
        value: 111,
        display: 'FAKE-111',
        source: 'fake source',
        verifiedOn: '2000-01-01',
      },
      {
        id: 'fake-claim-b',
        value: 'fake text',
        display: 'FAKE B',
        source: 'fake source',
        sourceUrl: 'https://example.com/s',
        verifiedOn: '2000-01-02',
        note: 'fake note',
      },
    ],
    projects: [
      {
        id: 'fake-project',
        name: 'Fake Project',
        dateRange: 'Jan 2000 - Feb 2000',
        featured: true,
        order: 1,
        oneLiner: 'A fake project.',
        headlineClaimId: 'fake-claim-a',
        contextClaimIds: ['fake-claim-b'],
        links: [link],
        demo: { url: 'https://example.com/demo', screenshot: 'fake.png', what: 'Fake demo.' },
        stack: ['FakeLang'],
      },
    ],
    skills: [
      {
        name: 'FakeSkill',
        category: 'Fake',
        tier: 'shipped',
        evidence: ['fake-project', 'fake-claim-a'],
        roles: ['ai', 'ml'],
        aliases: ['fake skill'],
      },
    ],
    roles: [
      { id: 'ai', title: 'Fake AI Engineer', summary: 'Fake summary.', pdfFile: 'Fake-AI.pdf' },
    ],
    figures: [
      {
        id: 'fake-fig',
        projectId: 'fake-project',
        kind: 'bars',
        alt: 'fake alt',
        bars: [{ label: 'a', value: 1 }],
        axisLabel: 'x',
        caption: 'c',
        note: 'n',
        claimIds: ['fake-claim-a'],
      },
      {
        id: 'fake-img',
        projectId: 'fake-project',
        kind: 'image',
        src: 'fake.png',
        alt: 'fake alt',
        axisLabel: 'x',
        caption: 'c',
        note: 'n',
        claimIds: [],
      },
    ],
    resume: {
      header: {
        name: 'Fake Person',
        location: 'Nowhere',
        email: 'fake@example.com',
        phone: '000-000-0000',
        links: [link],
      },
      education: [
        { school: 'Fake U', degree: 'Fake degree', dateRange: '2000 - 2001', details: [] },
      ],
      skillGroups: [{ label: 'Fake', skills: ['FakeSkill'] }],
      experience: [
        {
          company: 'Fake Co',
          title: 'Fake title',
          location: 'Nowhere',
          dateRange: '2000 - 2001',
          bullets: [{ text: 'Did fake things.', claimIds: ['fake-claim-a'] }],
        },
      ],
      projects: [
        { projectId: 'fake-project', bullets: [{ text: 'Built it.', claimIds: ['fake-claim-b'] }] },
      ],
      publication: { citation: 'Fake citation.', url: 'https://example.com/pub' },
    },
    site: {
      name: 'Fake Person',
      location: 'Nowhere',
      availability: 'fake',
      email: 'fake@example.com',
      phone: '000-000-0000',
      profiles: {
        linkedin: 'https://example.com/l',
        github: 'https://example.com/g',
        huggingface: 'https://example.com/h',
        medium: 'https://example.com/m',
      },
      showPhoto: false,
    },
    evidence: [
      { id: 'fake-project', proofClaimIds: ['fake-claim-a', 'fake-claim-b'], link: 'demo' },
    ],
    applications: { 'fakeco-abc234.json': validApplication() },
  };
}

export function validApplication(): Record<string, unknown> {
  return {
    company: 'FakeCo',
    role: 'Fake Engineer',
    created: '2000-01-01',
    expires: '2000-04-01',
    verdict: { label: 'Strong fit', key: 'strong' },
    counts: { proven: 1, gaps: 1 },
    evidenceRows: [
      {
        id: 'fake-project',
        name: 'Fake row',
        proof: 'Fake proof.',
        matchCount: 1,
        tags: ['FakeSkill'],
      },
    ],
    gaps: ['OtherSkill'],
  };
}
