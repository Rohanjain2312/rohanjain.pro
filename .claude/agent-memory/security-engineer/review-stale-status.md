---
name: review-stale-status
description: When writing or reviewing a findings register or threat model, verify every status against current origin/main and live gh api settings, and list every risk an ADR accepts
metadata:
  type: feedback
---

When writing or reviewing a findings register, check every status against current `origin/main` and live `gh api` settings, not the PR's base, and list every risk an ADR accepts.

**Why:** PR #49 (threat model) branched from 9a325a0. By review time, #32, #44, #45, #46, #60, #61 and #62 were closed and ADR-0016 to ADR-0018 had merged, but the doc still showed them as open gaps, cited old settings (no interaction limit, first-time fork approval, `sha_pinning_required` false), and left out the residual risk ADR-0018 accepts. The independent review returned CHANGES REQUESTED (L1 to L4, I1, I2).

**How to apply:** before pushing or approving a register, `git fetch` and rebase; run `gh issue list --state all` and `gh pr list --state merged` for every cited number; re-read live settings (interaction-limits, actions/permissions, fork-pr-contributor-approval, actions/permissions/workflow, security_and_analysis); re-run hook probes at current `main`; read each ADR's "accepted" or "residual" clause and give it an RR row. Status values: closed #N (PR #M), active, accepted (ADR, RR), open #N (Low). Related: [[severity-calibration]].

**Second incident (PR #40, review at 2218461, 2026-10-16):** the Phase 0 log went stale within hours of the head commit. Four statuses were wrong: a client item (the `write:ssh_signing_key` scope) the client had already finished, an issue (#72) created after the commit, "fixed in #69" claims with no fix on `main`, and an old `main` SHA in the header. Extra checks for any log or register:
- Re-read live token scopes (`gh auth status`) and the open-issue list (`gh issue list --label severity:low --state open`) right before the final push; count them against the document.
- Never write "fixed in X" for another role's work until the fix is on `main` or in a PR whose file list covers it (`gh pr view <n> --json files`). Write "in progress: PR #N".
- Remove "open client item" text once the item is ticked; keep history in the finding row.
- After the last rebase, update the "against main <sha>" line and the PR title and body (the squash subject lands on `main`).
