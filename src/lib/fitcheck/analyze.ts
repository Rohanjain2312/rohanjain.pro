// The fit-check engine (docs/spec/06-architecture.md section 5.4). Pure: same input, same Report.
import { config } from './thresholds.ts';
import { matcherFor, matchesAny } from './matcher.ts';
import { normalizeText } from './normalize.ts';
import type {
  Analyze,
  EvidenceItem,
  EvidenceRow,
  Report,
  RoleFamily,
  VerdictKey,
  VerdictLabel,
} from './types.ts';

export function verdictFor(
  matches: number,
  ratio: number,
): { verdict: VerdictLabel; verdictKey: VerdictKey } {
  if (matches < config.minMatches) return { verdict: 'Not enough to go on', verdictKey: 'none' };
  if (ratio >= config.thresholds.strong) return { verdict: 'Strong fit', verdictKey: 'strong' };
  if (ratio >= config.thresholds.good)
    return { verdict: 'Good fit, with gaps', verdictKey: 'good' };
  return { verdict: 'Not a strong fit', verdictKey: 'weak' };
}

function pickFamily(counts: Record<RoleFamily, number>): RoleFamily {
  let best = config.roleTieOrder[0] ?? 'ml';
  for (const family of config.roleTieOrder) {
    if (counts[family] > counts[best]) best = family;
  }
  return best;
}

function evidenceRows(
  provenSkills: { name: string; evidence: readonly string[] }[],
  evidence: readonly EvidenceItem[],
): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  for (const item of evidence) {
    const names = provenSkills.filter((s) => s.evidence.includes(item.id)).map((s) => s.name);
    if (names.length === 0) continue;
    const row: EvidenceRow = {
      id: item.id,
      name: item.name,
      proof: item.proof,
      matchCount: names.length,
      tags: names.slice(0, config.maxTagsPerRow),
    };
    if (item.href) row.href = item.href;
    if (item.linkLabel) row.linkLabel = item.linkLabel;
    rows.push(row);
  }
  // Array.prototype.sort is stable: equal counts keep the order of the evidence list.
  return rows.sort((a, b) => b.matchCount - a.matchCount).slice(0, config.maxEvidenceRows);
}

export const analyze: Analyze = (text, skills, extras, evidence) => {
  const haystack = normalizeText(text);
  const matcher = matcherFor(skills, extras);

  const proven: string[] = [];
  const gaps: string[] = [];
  const provenSkills: { name: string; evidence: readonly string[] }[] = [];
  const familyCounts: Record<RoleFamily, number> = { ai: 0, ml: 0, ds: 0 };

  const hits = matcher.skills.filter(({ terms }) => matchesAny(haystack, terms));
  const extraHits = matcher.extras.filter(({ terms }) => matchesAny(haystack, terms));
  // Plain-English skill names count only beside proven technical matches (issue #243).
  // Only shipped and work skills give context, so adding a gap term never changes the proven count.
  const context = hits.filter(
    (h) => !h.needsContext && (h.skill.tier === 'shipped' || h.skill.tier === 'work'),
  ).length;
  const contextOk = context >= config.minContextMatches;

  for (const { skill } of hits.filter((h) => contextOk || !h.needsContext)) {
    // Only shipped and work count as proven. Studied and anything else is a gap (R-403).
    const isProven = skill.tier === 'shipped' || skill.tier === 'work';
    if (isProven) {
      proven.push(skill.name);
      provenSkills.push({ name: skill.name, evidence: skill.evidence });
    } else {
      gaps.push(skill.name);
    }
    for (const family of skill.roles) familyCounts[family] += 1;
  }
  const seen = new Set([...proven, ...gaps].map((n) => n.toLowerCase()));
  for (const { extra } of extraHits) {
    if (seen.has(extra.name.toLowerCase())) continue;
    seen.add(extra.name.toLowerCase());
    gaps.push(extra.name);
  }

  const matches = proven.length + gaps.length;
  const ratio = matches === 0 ? 0 : proven.length / matches;
  const { verdict, verdictKey } = verdictFor(matches, ratio);

  const report: Report = {
    verdict,
    verdictKey,
    enough: matches >= config.minMatches,
    provenCount: proven.length,
    gapCount: gaps.length,
    ratio,
    proven,
    gaps,
    evidenceRows: evidenceRows(provenSkills, evidence),
    roleFamily: pickFamily(familyCounts),
  };
  return report;
};
