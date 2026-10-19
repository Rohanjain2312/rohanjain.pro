---
name: tracker-pointer-and-tick-evidence
description: On a checklist-closing PR, verify each ticked "done" against the artifact and each "Lows on #N" pointer against issue N's comments. Both failed on PR #261.
metadata:
  type: feedback
---

When an issue checklist is closed by a PR, check two things per box, not one.

1. Ticked "done" or "partly done": open the artifact the box names and confirm the claimed state at head. A box that says "covers all worktrees at the gate" is a plan, not a result. A box ticked "partly done" does not meet "fixed or struck with a reason".
2. Struck or deferred with "Lows on #N" or "remaining drift goes on #N": grep issue N (comments too, not only the body) for each deferred item. On PR #261, the #233 body was a bare header and its comments held the Low backlog. Five deferred items were not on it.

**Why:** PR #261 (issue #244, head d61ea84) ticked the memory sweep as done with no evidence. `docs/status.md` still said the copy was pending, and six QA memory files sat only in five worktrees. It also struck 163-y, 163-ad, 195-l and 215-b with "Lows on #233", and none of those items was on #233. The reasons read well, but the tracker pointer was false.

**How to apply:** build a table of box, claimed state, artifact and grep result before the Checked list. Use `gh api repos/<o>/<r>/issues/N/comments > <scratch file>` to read comments (`gh issue view --comments` fails here on the Projects-classic GraphQL notice). Count every grep hit on the issue. For a memory or sweep claim, run a node script that compares each worktree's agent-memory folder with the committed copy. Related: [[docs-review-checks]], [[feedback-medium-fix-check-all-sources]], [[project-pr261-phase6-text-lows]].
