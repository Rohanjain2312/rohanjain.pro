---
name: project-pr274-needs-client
description: PR #274 (needs-client update after 2026-10-19 answers) approved at e7ddc56 with three Lows on #233; open-item scope questions to recheck on the next needs-client.md change.
metadata:
  type: project
---

PR #274 approved at e7ddc564632e73c934509fb84ab0eeec6f6f528b (2026-10-19). One file changed, docs/needs-client.md. Lows went to issue #233: the CLI install item lost its exact steps, the Phase 7 parenthetical was reworded to match docs/status.md line 5, and the ADR-0018 token and Keychain item plus the five-second `npm run browsers:install` step may sit outside CLAUDE.md client-only item 1.

**Why:** the Supervisor asked for a one-round review. Lows, not CHANGES REQUESTED, were the agreed route. The ADR-0018 item is pre-existing, so it is a judgment call for the Supervisor, not a regression.

**How to apply:** on the next needs-client.md change, recheck every open item against the CLAUDE.md client-only list and whether the header promise "Each item has exact steps" still holds. Confirm the ADR-0018 scope question was answered on #233. Check the Done list dates against issue #270's chat answers.

Related: [[feedback-medium-fix-check-all-sources]], [[feedback-tracker-pointer-and-tick-evidence]].
