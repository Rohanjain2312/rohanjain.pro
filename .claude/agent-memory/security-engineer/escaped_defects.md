---
name: escaped-defects
description: Defects I missed in a review and caught later; read before every review to avoid repeating them
metadata:
  type: feedback
---

Check mappings mechanically with a script, not by eye.

**Why:** In the first review of PR #36 (2026-10-15), I read CODEOWNERS against owners.json by eye. I treated the repeated `tokens.css` and `src/assets/brand/` lines as correct exclusions. They sat under the frontend-engineer heading, after the broader patterns, so with last match wins they mapped to the wrong role. A script found the problem in the re-review, and it cost an extra review round.

**How to apply:**
- For any file that maps paths to owners, check three things with a script: every owners.json pattern appears under its own role heading; for each `!` exclusion, the last matching line is under a role other than the excluding one; there are no extra patterns.
- Run the script in the first review, not only in the re-review.

Related: [[review-checklist-repo-settings]]

## Log completeness (PR #40, 2026-10-16)

The first Phase 0 log recorded only PR #36. An independent review caught it (40-L1). Build the log from the REVIEW comments of every PR in scope, one PR at a time, and list the PRs checked. See [[review-checklist-escaped-defects]]. Hook-specific misses: [[escaped-hook-path-traversal]], [[hook-review-checklist]].
