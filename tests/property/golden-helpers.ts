// Shared loaders for the golden-set tests (docs/spec/09-quality.md section 9.4). QA owns these files.
import { readFileSync, readdirSync } from 'node:fs';
import type { Skill, VerdictLabel } from '../../src/lib/fitcheck/index.ts';

const GOLDEN = 'tests/fixtures/golden';

export interface Posting {
  id: string;
  roleFamily: string;
  company: string;
  requirements: string[];
}

export interface Sample {
  id: string;
  label: string;
  company: string;
  title: string;
  jd: string;
}

export interface RubricEntry {
  expected: VerdictLabel;
  proven: string[];
  gaps: string[];
  unlisted: string[];
}

export interface Verdicts {
  rubric: string;
  rubricVersion: number;
  raters: { qa: string; readerAdvocate: string };
  postings: Record<string, RubricEntry>;
  samples: Record<string, RubricEntry>;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export const skills: Skill[] = readJson<Skill[]>('src/content/skills.json');
export const verdicts: Verdicts = readJson<Verdicts>(`${GOLDEN}/verdicts.json`);
export const samples: Sample[] = readJson<Sample[]>(`${GOLDEN}/samples.json`);

export const postingFiles: string[] = readdirSync(GOLDEN)
  .filter((f) => f.endsWith('.json') && f !== 'verdicts.json' && f !== 'samples.json')
  .sort();

export const postings: Posting[] = postingFiles.map((f) => readJson<Posting>(`${GOLDEN}/${f}`));

/** A posting becomes the text a visitor would paste: one requirement per line. */
export function postingText(p: Posting): string {
  return p.requirements.join('\n');
}

/** Negative controls are the unrelated and adjacent postings (section 9.4 item 1). */
export function isNegativeControl(p: Posting): boolean {
  return p.roleFamily === 'unrelated' || p.roleFamily === 'adjacent';
}
