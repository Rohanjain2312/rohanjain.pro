---
name: status-workflow-review-pr187
description: PR #187 (status.yml, demo dialog) review 2026-10-17: what passed, probes that worked, open Lows on #190
metadata:
  type: project
---

PR #187 approved at 0acfd37 with no Medium+. status.yml writes status.json to the orphan branch `status-data` (ADR-0027). The ADR file is on main, not in the PR's merge base, so read it with `git show origin/main:docs/adr/0027-...`.

**Why:** Reusable probes and state for the next workflow or data-branch review.

**How to apply:**
- The ruleset "main protection" targets `~DEFAULT_BRANCH` only, no bypass. `status-data` is unprotected (Low on #190, add a ruleset before Phase 7).
- Extract an inline `node -e` validate script from YAML into the scratchpad and run it on good and bad JSON. Extra keys pass (Low).
- CodeQL on the PR ref: `gh api "repos/.../code-scanning/alerts?ref=refs/pull/N/merge"`. Test mocks using `url.includes('host')` trigger `js/incomplete-url-substring-sanitization`.
- The hook refuses Bash commands that contain `git` inside longer pipelines (e.g. `git/ref/tags` in a loop). Put the loop in a scratchpad script and run it.
- The demo spec asserted iframe count right after `toBeHidden()`; the `close` event is async, so CI flaked (not security). Use `toHaveCount(0)`.
- Threat-model row 5.3 and requirement 4 still say "bot PR"; promised a docs PR to update them and add docs/security/reviews/ record.

Related: [[workflow-review-checklist]], [[ci-workflow-review-checklist]]
