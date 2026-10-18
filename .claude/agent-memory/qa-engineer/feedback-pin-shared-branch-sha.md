---
name: feedback-pin-shared-branch-sha
description: Feature and platform branches move while QA reviews them because refs are shared across worktrees. Pin the SHA you judge and re-read the tip before the verdict.
metadata:
  type: feedback
---

When a review judges a branch (not a PR head), record its SHA at the start, and check the tip again before writing the verdict. Name the SHA each finding was confirmed at.

**Why:** On PR #200 (2026-10-17) origin/platform/183-status-and-gate moved from b613822 to d3dba98 during the review. Other sessions share this repo's refs, so another agent's fetch or push moves them under you. The new commit fixed both Mediums that the record reported at 0acfd37. A verdict based on the old tip would have been wrong.

**How to apply:** Run `git rev-parse origin/<branch>` at the start and again before posting. For a fix that lands on the tip, check the CSS diff with `git show <sha> -- <file>` and any committed screenshots, and list it in the Checked section. Related: [[project-pr200-phase2-gate-review]], [[feedback-r705-issue-before-body]].
