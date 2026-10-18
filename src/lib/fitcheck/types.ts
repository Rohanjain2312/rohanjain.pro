// Types for the fit-check engine (docs/spec/06-architecture.md section 5.4).
// A Report holds plain data only. The UI renders every string as a text node (R-405).
import type { z } from 'astro/zod';
import type { roleFamily, skillSchema } from '../content/schemas.ts';

export type RoleFamily = z.infer<typeof roleFamily>;
export type Skill = z.infer<typeof skillSchema>;

export type VerdictLabel =
  'Strong fit' | 'Good fit, with gaps' | 'Not a strong fit' | 'Not enough to go on';

/** Key for styling: maps to --verdict-strong, --verdict-good, --verdict-weak, --verdict-none. */
export type VerdictKey = 'strong' | 'good' | 'weak' | 'none';

/** A market skill Rohan has not proven (Swift, CUDA, ...). It can only ever be a gap. */
export interface Extra {
  name: string;
  aliases: string[];
}

/** One proof item (a project or job), in display order. Skills point to it by id through `evidence`. */
export interface EvidenceItem {
  id: string;
  name: string;
  proof: string;
  href?: string;
  linkLabel?: string;
}

/** An evidence row in the report. `tags` are the proven skill names for this item, at most 8. */
export interface EvidenceRow {
  id: string;
  name: string;
  proof: string;
  href?: string;
  linkLabel?: string;
  /** All proven skills matched for this item, before the 8-tag cut. Rows are ranked by this. */
  matchCount: number;
  tags: string[];
}

export interface Report {
  verdict: VerdictLabel;
  verdictKey: VerdictKey;
  /** False when proven + gaps is below the minimum. The verdict is then "Not enough to go on". */
  enough: boolean;
  /** Counts shown as "N proven" and "M to ramp up". */
  provenCount: number;
  gapCount: number;
  /** proven / (proven + gaps); 0 when nothing matched. */
  ratio: number;
  /** Proven skill names (shipped and work tiers), in skills.json order. */
  proven: string[];
  /** Gap names: studied-tier skills and unknown market skills, in skills.json then extras order. */
  gaps: string[];
  /** Up to 4 rows, ranked by matchCount. Empty when nothing proven matched. */
  evidenceRows: EvidenceRow[];
  /** Family with the most matched skills (proven and studied). Ties and no matches fall back to the order in thresholds.ts. */
  roleFamily: RoleFamily;
}

/** The pure entry point. The text is user input: it is only ever compared, never compiled. */
export type Analyze = (
  text: string,
  skills: readonly Skill[],
  extras: readonly Extra[],
  evidence: readonly EvidenceItem[],
) => Report;
