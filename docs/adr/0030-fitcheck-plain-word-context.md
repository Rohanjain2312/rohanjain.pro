# ADR-0030: fit-check plain-word skills need technical context

Status: accepted · 2026-10-18 · Supervisor, from the App/Data draft (R-004, R-404)

## Context
R-404 requires an ADR in the same PR whenever fit-check thresholds change. Issue #243 reports that skills whose names are ordinary English words (for example Accuracy, Recall, Mentoring, Deployments) matched in postings that have no technical content. A sales or HR posting that says "improve accuracy" or "mentoring" could then count as a proven match. That inflates the verdict and breaks the claim that every proven skill is real evidence (R-403).

## Decision
Some skills have names, or aliases, that are ordinary English words or everyday business phrases. They are listed as `plainWordSkills` in `src/lib/fitcheck/thresholds.ts`: Accuracy, Precision, Recall, Calibration, Mentoring, Deployments, Benchmarking, Probability, Forecasting, Guardrails, Classification, Clustering, Data analysis, Data quality, Stakeholder management, Workflow automation, Executive presentation, Requirements gathering, Root-cause analysis, Cost optimization, Business analytics, Document processing, State management, Error analysis.

A plain-word skill counts (as proven or as a gap) only when the text also matches at least `minContextMatches` (2) distinct skills from `technicalContextSkills`. That is a curated list of 33 named tools, languages, libraries and methods that non-technical text does not use (for example Python, SQL, PyTorch, Docker, Kubernetes, RAG). Only shipped and work skills give context, and studied skills and gaps never do. The two lists do not overlap, and a test checks that every listed name exists in `skills.json`.

The first version of this decision took context from any two non-plain-word skills. QA showed that business phrases then unlocked the plain words (an account-executive text returned "Strong fit"), so the context list became curated and the business phrases moved into `plainWordSkills`.

Related hardening in the same PR: `normalizeText` and `normalizeTerm` remove invisible characters (soft hyphen, zero-width, bidi marks, word joiner, BOM) before matching, so they cannot split a word to dodge or force a match.

No other threshold changes. The input cap, the 4-match floor and the 0.80 and 0.55 ratios from ADR-0029 stay as they are.

## Alternatives
- Remove the plain-word skills from the skill list: loses real evidence for postings that do cover them.
- Require the plain word inside a technical phrase only (aliases such as "model accuracy"): needs many aliases, still misses variants, and the alias list is curated by hand.
- Context threshold of 1: one stray tool name would unlock all the plain words.
- Context threshold of 3 or more: hides the plain words in short but genuine postings.
- Let studied skills give context: breaks R-403, which says studied skills never count as proven.
- Take context from skill categories: categories in `skills.json` mix technical and business skills (Data Science & Analytics holds both Tableau and Executive presentation).

## Consequences
- Non-technical texts (nurse, lab technician, account executive) return "Not enough to go on" or "Not a strong fit". They no longer return "Strong fit" from ordinary words or business phrases.
- A technical posting is unaffected, because it matches several listed skills.
- A posting with fewer than 2 listed technical skills loses its plain-word matches, including gaps. For example, ds-04 loses Clustering and Probability from its gap list; its verdict is unchanged. The gap list can under-report in such postings.
- The context list is maintained by hand. A new skill that should unlock plain words must be added to `technicalContextSkills`. A renamed skill fails the existence test instead of silently disabling the rule.
- Context is counted per skill, not per phrase. One phrase such as "Hugging Face Transformers" can match several listed skills. This is tracked in #233.
- Tests are in `tests/unit/fitcheck-plain-words.test.ts`. One mutation run at head `38df83b6577cb9d593d25395e1f14fa40518045c` scored 95.54 (293 killed, 7 timed out, 14 survived).
- Any later change to `plainWordSkills`, `technicalContextSkills` or `minContextMatches` needs a new ADR in the same PR.
