import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyze, extras, normalizeText } from '../../src/lib/fitcheck/index.ts';
import type { Skill } from '../../src/lib/fitcheck/index.ts';

const real = JSON.parse(readFileSync('src/content/skills.json', 'utf8')) as Skill[];

// Negative controls for QA (issue #243). Plain words, no technical work.
export const nurse =
  'Registered nurse, ICU. Accuracy in medication dosing, calibration of infusion pumps, precision charting, recall of patient histories, mentoring new nurses, unit and integration of care teams, deployments to float pools.';
export const lab =
  'Laboratory technician, clinical chemistry. Accuracy and precision in sample prep, calibration of analyzers, recall of reagent lot numbers, mentoring junior staff, benchmarking against reference standards, probability of error in each run, clustering of samples by batch, forecasting reagent supply, deployments of new assay kits.';

describe('plain-word skills need technical context (#243)', () => {
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
  it('strips zero-width, soft-hyphen and bidi characters', () => {
    expect(normalizeText('Py​Torch')).toBe('pytorch');
    expect(normalizeText('Dock­er ‍﻿Kuber⁠netes')).toBe('docker kubernetes');
    expect(normalizeText('a‎‪b⁤c᠎d')).toBe('abcd');
  });
  it('finds a skill split by a zero-width character', () => {
    const skills: Skill[] = [
      { name: 'PyTorch', category: 'test', tier: 'shipped', evidence: [], roles: ['ml'], aliases: [] },
    ];
    expect(analyze('We use Py​Torch daily', skills, [], []).proven).toEqual(['PyTorch']);
  });
});
