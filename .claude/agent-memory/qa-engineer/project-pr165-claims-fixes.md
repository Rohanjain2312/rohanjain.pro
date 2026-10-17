---
name: project-pr165-claims-fixes
description: PR #165 (claims fixes #140-#146, check-claims #151) approved at dc071e7 with Lows; QA still owes the claims-verification log re-date after merge
metadata:
  type: project
---

PR #165 was approved at dc071e76227755d35a186c90a1777cab98dd0ab5 (label approved:qa). Lows went to issue #163.

**QA debt:** after #165 merges, update `docs/qa/claims-verification.md` Result and Date columns for #140 to #146 rows, the totals line (91 claims) and the summary. The builder changed only the value column, which is all the completeness check tests.

**Check-claims design (for later reviews):** per-occurrence match uses claim display containment or any 5-letter word stem within 60 characters. It is loose by design, so a wrong number passes if a stem of a claim holding that number is nearby. Real-content probe: run every `claims.json` display and every string in `resume.json`, `roles.json`, `skills.json` through `checkHtml` with `buildClaimIndex`. Only `9.1x` (fc-size-ratio) falsely failed.

**Why:** the Supervisor overrode client decisions (R-302, R-306 text is stale, no ADR). `skills.json` still tiers Docker, Kubernetes, GKE, A2A as shipped with evidence `loan` only.

**How to apply:** when the résumé page or fit-check lands, re-run the real-content probe and check that those skills are re-tiered or sourced. See [[project-qa-tooling-gaps]].
