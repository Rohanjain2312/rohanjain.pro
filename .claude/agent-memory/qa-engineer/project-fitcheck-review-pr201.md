---
name: project-fitcheck-review-pr201
description: PR #201 independent review at 507015f - CHANGES REQUESTED because the mutation score (79.65) does not reproduce in a clean run; recheck recipe
metadata:
  type: project
---

Review of PR #201 (engine + golden set) at head 507015f (same engine bytes as bdeee22). Verdict: CHANGES REQUESTED, one Medium: `FC_RUNS=100 npm run mutation` in a clean export scored 79.65 twice (break 80, exit 1); the PR claimed 82.46. matcher.ts is 69.94; survivors are `isWordChar` edges, `SHORT_BEFORE` characters, the short-term cut, nameNeedsAlias own-name removal. Likely cause of the higher claim: `incremental: true` with a stale `.stryker-tmp` cache.

Everything else passed: 21 of 21 verdicts agree, thresholds unchanged, no RegExp from input, adversarial 8,000-char inputs under 20 ms, hand mutations caught, evidence.json built from claims, npm audit --omit=dev clean, CI green.

**Why:** a score from a warm incremental cache can overstate the real one.
**How to apply:** on re-review delete `.stryker-tmp` and `reports/`, run the command once (about 8 minutes, run nothing else), compare per-file scores with 79.65 / matcher 69.94. Lows are on issue #195. Related: [[project-fitcheck-qa-pr201]].
