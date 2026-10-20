---
name: gate-record-pending-steps
description: Gate and status rows must not state a pending step as done; check every cited pointer file exists and says what the row claims (PR #267 round 1)
metadata:
  type: feedback
---

A gate record or resume pointer must not describe a step as done when it has not happened yet (a tag, a release, a run). A row whose evidence is a pointer to another file must find that file contains the entry.

**Why:** PR #267 (Phase 6 gate, round 1) wrote "Phase: 6 complete (... release `v0.9.0`)" in `docs/status.md` while no release or tag existed. Its Firefox row cited `docs/needs-client.md`, which had no Firefox entry. Its budget row said "Pass" with PR numbers only; the CI Lighthouse step is an echo that passes trivially.

**How to apply:** On any gate or status review:
- For each "Pass" row, ask what the evidence shows at the head: a run, a number, a file that exists, or only a PR that was merged. A PR number alone does not show a budget was met.
- Grep the cited file for the entry the row names (for example `grep -n -i firefox docs/needs-client.md`).
- For "release", "tag", or "renewed" wording, check the live state (`gh release view`, `git tag -l`, the interaction-limit `expires_at`) and compare the tense.
- A CI step that only echoes text is not a check. Read the workflow step body.

See [[project-pr267-phase6-gate-review]].

Also (PR #271): a removed open question is a loss even when the diff looks clean. Before approving a removal in `docs/needs-client.md`, check that each removed claim or number is tracked elsewhere (the 10-prompt claim was dropped with the résumé numbers). Check agent id from the pwd of the worktree, not from the sandbox allowlist (the allowlist listed a different worktree).
