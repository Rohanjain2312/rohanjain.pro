# ADR-0029: fit-check initial thresholds

Status: accepted · 2026-10-17 · Supervisor (R-004, R-404)

## Context
R-404 requires an ADR in the same PR whenever fit-check thresholds change. PR #201 adds the engine and with it the first threshold file (`src/lib/fitcheck/thresholds.ts`).

## Decision
The initial values are exactly those in `docs/spec/06-architecture.md` §5.4 and are not tuned yet:
- Input cap: 8,000 characters.
- Fewer than 4 matches (proven plus gaps): "Not enough to go on".
- Ratio `proven / (proven + gaps)`: 0.80 or more is "Strong fit"; 0.55 to below 0.80 is "Good fit, with gaps"; below 0.55 is "Not a strong fit".

Tuning follows `docs/spec/09-quality.md` §9.4: when the engine disagrees with the QA rubric, fix aliases or tiers first; change a threshold only with a new ADR in the same PR.

## Consequences
- The golden set (QA, same PR) is the first check of these values. An early App/Data run shows some synthetic AI and ML postings that list many studied tools come out "Not a strong fit"; that is expected under the spec's rule that studied skills never count as proven (R-403) and is for the rubric to judge, not a reason to move a threshold now.
- Any later change to a value in `thresholds.ts` needs ADR-0030 or later.

## Alternatives
- Tune the thresholds before the rubric exists: breaks the golden-set separation in §9.4.
