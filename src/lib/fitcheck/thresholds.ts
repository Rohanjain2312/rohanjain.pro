// Engine settings. Edit values here only; no other file holds a number that decides a verdict.
// Threshold values are tuned against the golden set (docs/spec/09-quality.md section 9.4) and change only with an ADR (R-404).
import type { RoleFamily } from './types.ts';

export const config = {
  /** Input is cut to this many characters before and after normalization. */
  maxChars: 8000,
  /** Fewer matches than this (proven + gaps) gives "Not enough to go on". */
  minMatches: 4,
  /** Ratio edges: at or above `strong` is "Strong fit"; at or above `good` is "Good fit, with gaps". */
  thresholds: { strong: 0.8, good: 0.55 },
  maxEvidenceRows: 4,
  maxTagsPerRow: 8,
  /** Wins ties between role families, and the answer when nothing matched. */
  roleTieOrder: ['ml', 'ai', 'ds'] as readonly RoleFamily[],
  /**
   * Skills whose bare name is a common English word. They match only through their aliases (R-406).
   * Filled from the alias audit.
   */
  nameNeedsAlias: [
    'Go',
    'React',
    'Swift',
    'Triton',
    'Attention',
    'Ray',
    'Lambda',
    'Monitoring',
    'Algorithms',
    'Data structures',
  ] as readonly string[],
};

export type Config = typeof config;
