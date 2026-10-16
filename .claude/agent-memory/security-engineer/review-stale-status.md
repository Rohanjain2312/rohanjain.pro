---
name: review-stale-status
description: When writing or reviewing a findings register or threat model, verify every status against current origin/main and live gh api settings, and list every risk an ADR accepts
metadata:
  type: feedback
---

When writing or reviewing a findings register, check every status against current `origin/main` and live `gh api` settings, not the PR's base, and list every risk an ADR accepts.

**Why:** PR #49 (threat model) branched from 9a325a0. By review time, #32, #44, #45, #46, #60, #61 and #62 were closed and ADR-0016 to ADR-0018 had merged, but the doc still showed them as open gaps, cited old settings (no interaction limit, first-time fork approval, `sha_pinning_required` false), and left out the residual risk ADR-0018 accepts. The independent review returned CHANGES REQUESTED (L1 to L4, I1, I2).

**How to apply:** before pushing or approving a register, `git fetch` and rebase; run `gh issue list --state all` and `gh pr list --state merged` for every cited number; re-read live settings (interaction-limits, actions/permissions, fork-pr-contributor-approval, actions/permissions/workflow, security_and_analysis); re-run hook probes at current `main`; read each ADR's "accepted" or "residual" clause and give it an RR row. Status values: closed #N (PR #M), active, accepted (ADR, RR), open #N (Low). Related: [[severity-calibration]].
