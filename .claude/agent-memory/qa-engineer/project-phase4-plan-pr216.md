---
name: phase-4-plan-pr216
description: Phase 4 plan review (PR #216, head 14b9ca1): CHANGES REQUESTED for the hook Security-review line in status.md (labeler and ADR-0026 do not cover hooks); Lows on #215. Re-check at next head.
metadata:
  type: project
---

PR #216 (Phase 4 plan, issue #211) round 1: CHANGES REQUESTED. One Medium, four Lows (on #215).

- Medium: `docs/status.md` adds "hooks" to the Security-review trigger list. ADR-0026, run-review and `.github/labeler.json` cover only workflows, workflow scripts, the labeler and `public/_headers`. ADR-0016 requires Security review for the Phase 4 hook exception (#214), which no label rule triggers.
- Lows: "two PRs in review" misquotes ADR-0024 decision 5; spec's "one sample /for page" narrowed to a temp dir; PR B omits "generated at build" (ADR-0010); status says "Phase 3 closed" before its release.
- Verified clean: skill fallback line matches the 7-of-10 rule; gate row file name matches `tests/visual/shots.mjs`; lint-docs, lint-copy, prettier pass; phase-gate 3 OK; phase-gate 4 fails only on the missing gate record (expected).

**Why:** the plan and status restate process rules; wording that drifts from the labeler lets a privileged review go unrequired.
**How to apply:** at the next head, grep `docs/status.md` and `.github/labeler.json` for the Security list. Confirm the #214 label plan. Check the four Lows were fixed or moved on #215.
