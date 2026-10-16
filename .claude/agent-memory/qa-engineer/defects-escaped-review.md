---
name: defects-escaped-review
description: Log of defects that got past review or were caught late. Read before each review to know which classes to recheck.
metadata:
  type: project
---

Log of defects that escaped review, with the round that caught them.

| Date | PR | Defect | Escaped | Caught by | Fix |
|---|---|---|---|---|---|
| 2026-10-16 | #84 (docs, #30) | README and CONTRIBUTING said hooks "enforce" rules. ADR-0018 calls them tripwires. | QA rounds 1 and 2 (596bc7a, 775a73a) | QA round 3 (cd0f7fb) | Wording changed to "catch common violations (tripwires, ADR-0018)" |
| 2026-10-16 | #84 (docs, #30) | Format gate (`prettier --check .`, added by #85) fails on README.md and CONTRIBUTING.md after rebase. | QA review at fa2361b, which ran verify only on the PR's own base | QA review at fa2361b, trial merge of origin/main | Pending: `prettier --write` on both files, rebase, re-verify |

**Why:** Each row shows a class of miss. The first is an overstated claim that the earlier reviews skimmed past. The second is a gate that landed on main after the review base.

**How to apply:** Check claims about enforcement against ADR-0018 wording. Re-run verify on the merged state before approval ([[verify-on-rebased-merge]]).
