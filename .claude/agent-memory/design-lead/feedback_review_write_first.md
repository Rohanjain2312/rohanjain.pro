---
name: feedback-review-write-first
description: In gate reviews, write the review record and open the draft PR early; do not spend turns on tooling (venvs, font scripts)
metadata:
  type: feedback
---

Write `docs/design/<gate>-review.md`, commit, push and open the draft PR before any optional work (favicon generation, extra scripts). Refine afterwards.

**Why:** On issue #192 (2026-10-17) I spent the turn budget on screenshots, a DOM audit and a Python venv for font tooling, hit the limit with no record written, and my worktree was removed. The Supervisor had to tell me to write first and use the existing screenshots.
**How to apply:** For a review task, view at most the three pages plus dialogs, then write the record. If the worktree disappears, make a new one with `git worktree add .claude/worktrees/<name> -b design/<issue>-<slug> origin/main`. Running `npm run verify` in a fresh worktree works by symlinking `node_modules` from another checkout (remove the link afterwards).

Related: [[feedback-branch-prefix]]
