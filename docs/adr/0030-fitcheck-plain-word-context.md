# ADR-0030: fit-check plain-word skills need technical context

Status: accepted · 2026-10-18 · Supervisor, from the App/Data draft (R-004, R-404)

## Context
R-404 requires an ADR in the same PR whenever fit-check thresholds change. Issue #243 reports that skills whose names are ordinary English words (for example Accuracy, Recall, Mentoring, Deployments) matched in postings that have no technical content. A sales or HR posting that says "improve accuracy" or "mentoring" could then count as a proven match. That inflates the verdict and breaks the claim that every proven skill is real evidence (R-403).

## Decision
Two new values in `src/lib/fitcheck/thresholds.ts`:
- `plainWordSkills`: 12 skill names that are plain English words (Accuracy, Precision, Recall, Calibration, Mentoring, Deployments, Benchmarking, Probability, Forecasting, Guardrails, Classification, Clustering).
- `minContextMatches`: 2.

A plain-word skill counts (as proven or as a gap) only when the posting also matches at least 2 other skills that are not plain-word skills and have tier shipped or work. Studied skills and gap terms never give context, so adding a gap term cannot change the proven count.

Related hardening in the same PR: `normalizeText` and `normalizeTerm` now remove invisible characters (soft hyphen, zero-width, bidi marks, word joiner, BOM) before matching, so they cannot split a word to dodge or force a match.

No other threshold changes. The input cap, the 4-match floor and the 0.80 and 0.55 ratios from ADR-0029 stay as they are.

## Alternatives
- Remove the plain-word skills from the skill list: loses real evidence for postings that do cover them.
- Require the plain word inside a technical phrase only (aliases such as "model accuracy"): needs many aliases, still misses variants, and the alias list is curated by hand.
- Context threshold of 1: one stray tool name would unlock all the plain words.
- Context threshold of 3 or more: hides the plain words in short but genuine postings.
- Let studied skills give context: breaks R-403, which says studied skills never count as proven.

## Consequences
- Non-technical postings no longer gain proven matches from plain words. They fall toward "Not enough to go on".
- Very short technical postings with fewer than 2 other proven matches lose their plain-word matches. QA's golden set is the check for this. Tune the value only with a new ADR.
- Tests are in `tests/unit/fitcheck-plain-words.test.ts`. One mutation run at head `18f7489846f82654a8d4ee28829a0941b63757ed` scored 96.46 (292 killed, 8 timed out, 11 survived).
- Any later change to `plainWordSkills` or `minContextMatches` needs a new ADR in the same PR.
