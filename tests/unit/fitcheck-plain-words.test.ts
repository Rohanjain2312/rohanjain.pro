import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyze, extras, normalizeText } from '../../src/lib/fitcheck/index.ts';
import { config } from '../../src/lib/fitcheck/thresholds.ts';
import type { Skill } from '../../src/lib/fitcheck/index.ts';

const real = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as Skill[];

// Negative controls for QA (issue #243). Plain words, no technical work.
export const nurse =
  'Registered nurse, ICU. Accuracy in medication dosing, calibration of infusion pumps, precision charting, recall of patient histories, mentoring new nurses, unit and integration of care teams, deployments to float pools.';
export const lab =
  'Laboratory technician, clinical chemistry. Accuracy and precision in sample prep, calibration of analyzers, recall of reagent lot numbers, mentoring junior staff, benchmarking against reference standards, probability of error in each run, clustering of samples by batch, forecasting reagent supply, deployments of new assay kits.';

// Business texts QA found at head 83ade69 (issue #243): every phrase is ordinary English.
export const accountExec =
  'Account executive. Stakeholder management with enterprise buyers, requirements gathering in discovery calls, executive presentation, workflow automation in the CRM, forecasting pipeline, accuracy in quotes, mentoring new reps, data analysis of territory performance.';
export const nurse2 =
  'registered nurse icu. accuracy in dosing, data quality of charts, data analysis of vitals, monitoring of patients, document processing, state management of beds, error analysis of incidents';

describe('plain-word skills need technical context (#243)', () => {
  it('does not unlock plain words from business phrases', () => {
    for (const text of [accountExec, nurse2]) {
      const r = analyze(text, real, extras, []);
      expect(['Not enough to go on', 'Not a strong fit']).toContain(r.verdict);
      expect(r.proven).not.toContain('Accuracy');
      expect(r.proven).not.toContain('Mentoring');
    }
  });
  it('counts distinct technical skills, not repeats of one', () => {
    const r = analyze('Python, python and PYTHON. Accuracy and recall.', real, extras, []);
    expect(r.proven).toEqual(['Python']);
  });
  it('names real skills in plainWordSkills and technicalContextSkills', () => {
    const names = new Set(real.map((s) => s.name));
    for (const n of config.plainWordSkills) expect(names.has(n), n).toBe(true);
    for (const n of config.technicalContextSkills) {
      expect(names.has(n), n).toBe(true);
      expect(config.plainWordSkills).not.toContain(n);
    }
  });
  it('gives "Not enough to go on" for the nurse text', () => {
    const r = analyze(nurse, real, extras, []);
    expect(r.verdict).toBe('Not enough to go on');
    expect(r.provenCount).toBe(0);
    expect(r.evidenceRows).toEqual([]);
  });
  it('gives "Not enough to go on" for the lab text', () => {
    const r = analyze(lab, real, extras, []);
    expect(r.verdict).toBe('Not enough to go on');
    expect(r.provenCount).toBe(0);
  });
  it('still counts the words beside two technical matches', () => {
    const r = analyze(
      'Python and SQL. Model accuracy, precision and recall, plus mentoring.',
      real,
      extras,
      [],
    );
    expect(r.proven).toEqual(
      expect.arrayContaining(['Python', 'SQL', 'Precision', 'Recall', 'Accuracy', 'Mentoring']),
    );
  });
  it('does not take one technical match as context', () => {
    const r = analyze('Python. Accuracy, precision, recall, calibration.', real, extras, []);
    expect(r.proven).toEqual(['Python']);
  });
  it('does not take gaps as context', () => {
    const r = analyze('Java and Scala. Accuracy and recall.', real, extras, []);
    expect(r.proven).toEqual([]);
  });
});

describe('invisible characters (195-f)', () => {
  // Built from code points so the source holds no invisible characters.
  const ch = (...codes: number[]) => String.fromCodePoint(...codes);
  it('strips zero-width, soft-hyphen and bidi characters', () => {
    expect(normalizeText(`Py${ch(0x200b)}Torch`)).toBe('pytorch');
    expect(normalizeText(`Dock${ch(0xad)}er ${ch(0x200d, 0xfeff)}Kuber${ch(0x2060)}netes`)).toBe(
      'docker kubernetes',
    );
    expect(normalizeText(`a${ch(0x200e, 0x202a)}b${ch(0x2064)}c${ch(0x180e)}d`)).toBe('abcd');
  });
  it('finds a skill split by a zero-width character', () => {
    const skills: Skill[] = [
      {
        name: 'PyTorch',
        category: 'test',
        tier: 'shipped',
        evidence: [],
        roles: ['ml'],
        aliases: [],
      },
    ];
    const text = `We use Py${ch(0x200b)}Torch daily`;
    expect(analyze(text, skills, [], []).proven).toEqual(['PyTorch']);
  });
});
