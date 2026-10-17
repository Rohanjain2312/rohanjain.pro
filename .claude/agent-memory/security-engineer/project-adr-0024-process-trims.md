---
name: project-adr-0024-process-trims
description: PR #158 (ADR-0024 ship faster) review state of 2026-10-16: the type:security moves I agreed or refused, open issues #160 and #161, and the rules that bind them
metadata:
  type: project
---

ADR-0024 (PR #158) trims process to speed the build. Final state: APPROVED at head 5ff4688 (comment 6229590295), approved:security label added. Earlier rounds: CHANGES REQUESTED at 6541e76, f1e8663 and 08bdb31. #160 and #161 closed. Agreement comments posted 2026-10-16 on #47, #54, #63, #153 (Phase 8) and #95 (Phase 3). Open Lows: needs-client content line now too broad (docs-only), tripwire gaps not listed in needs-client, R-803 wording, #128 Phase 2 process items.

**Why:** the client asked for faster builds without lower quality. The moves change where Security-owned Lows land, so each type:security move needs a Security agreement comment on the issue (ADR-0022 decision 4).

**Agreement state (verify before acting on it):**
- #47, #54, #63 to Phase 8: agreed in review (Low under ADR-0018 as written). #63's 53-L4 was already done on main.
- #153 to Phase 8: agreed, but it lacks the type:security label, so add it first.
- #95 to Phase 3: agreed; its own trigger is "before the first fit-check code lands". Phase 3 gate must say so.
- #91 to Phase 4: refused for the date check (83-S1), because `isoDate` validates `verifiedOn` in Phase 1 claims. Bounds and 83-I2 can move.
- #111 to Phase 4: refused. R-501 is tagged phase-1 and the JD content rule is its only content check. Platform Lows in #111 can move.
- Agreement comments on each issue are not posted yet. Post them only when this PR is re-reviewed and approved.

**How to apply:** on re-review, check only the fix diff (ADR-0024 decision 3, if it survives), confirm #160 and #161 are closed or rewritten, then post the per-issue agreement comments. Related: [[severity-calibration]], [[review-checklist-escaped-defects]].
