---
name: skills-alias-review-pr119
description: What QA found in the first curated skill aliases (PR #119) and the checks to rerun on any change to src/content/skills.json
metadata:
  type: project
---

PR #119 (head e4ef9e0, QA CHANGES REQUESTED round 1): schema, counts (300), tiers and role summaries were all correct, but the curated aliases included common English words: `spark` (Apache Spark, studied), `embedding` (Embeddings, shipped), `torch`. Overlap: `time series forecasting` (Forecasting) vs `time series` (Time-series analysis).

**Why:** the builder's self-check covered schema validity and counts, not alias semantics. A common-word alias creates false gaps or false proven matches, which breaks R-403 and the verdicts.

**How to apply:** on any change to `src/content/skills.json`, run a script that lists every single-word alias and every alias that is also an English word, then check that no alias collides with another skill's name or alias. Compare against `reference/skills_tiered.json` field by field. Round-2 check: confirm `spark`, `embedding` and `torch` are gone. A committed property test for count and reference parity is owed under `tests/property/`. See [[project-qa-tooling-gaps]].
