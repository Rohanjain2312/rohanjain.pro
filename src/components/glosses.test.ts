// Every gloss in copy/home.json must name a project or figure that exists, so a rename fails loudly.
import { describe, expect, it } from 'vitest';
import copy from './copy/home.json';
import figures from '../content/figures.json';
import projects from '../content/projects.json';

describe('glosses', () => {
  it('names only existing projects', () => {
    const known = projects.map((p) => p.id);
    for (const id of Object.keys(copy.glosses.projects)) expect(known, id).toContain(id);
  });
  it('names only existing figures', () => {
    const known = figures.map((f) => f.id);
    for (const id of Object.keys(copy.glosses.figures)) expect(known, id).toContain(id);
  });
});
