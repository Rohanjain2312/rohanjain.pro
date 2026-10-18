---
name: phase-3-plan-pr199
description: Phase 3 plan review (PR #199, head 11a79af): golden-set precondition from #162, Reader Advocate verdict omission, property 8 gap, early-start rule. Check these when reviewing #193 and #194.
metadata:
  type: project
---

PR #199 (Phase 3 plan and status, issue #196) got CHANGES REQUESTED on round 1 (2 Medium, 5 Low; Lows filed on #163).

- Golden-set fixtures (PR #193) need the #162 precondition first: an ADR (next free number was 0028) and the §9.4 update merged, with #162 closed, before any `tests/fixtures/postings/` commit. R-501 is starred. Check this before approving #193.
- §9.4 step 3 names QA and Reader Advocate as verdict assigners. The plan and #193 name QA only. Unrecorded deviation.
- §9.5 has nine fast-check properties. Issue #193 says 1 to 7, so property 8 (verdict matches thresholds) is in no PR. Require 1 to 8 at the #193 review.
- ADR-0024 point 6: Phase N+1 building may start only once Phase N has only findings fixes, audits and gate records left. Phase 2 still had PR #187 (build) open when this was reviewed.
- Escaped defects: none (first round). Nothing from this review belongs in [[escaped-defects]] yet.

**Why:** the plan treated the #162 golden-set issue as wording, and the status started Phase 3 building before the Phase 2 gate.
**How to apply:** when reviewing #193 or #194, check the #162 ADR and the property list first. Check that status and plan start-order matches ADR-0024 point 6.
