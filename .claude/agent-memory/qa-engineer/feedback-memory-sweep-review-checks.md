---
name: memory-sweep-review-checks
description: Checks for PRs that collect agent memory (session-protocol sweep, PR #207): index coverage in both directions, frontmatter, symlinks, guard-evasion wording.
metadata:
  type: feedback
---

A memory sweep PR needs index coverage checked in both directions, not only the link check. Every .md file in a role's memory directory should have a line in that role's MEMORY.md, and every line should resolve.

**Why:** PR #207 (issue #179, head 058ea72) passed the link check and the frontmatter check. Still, 14 of the 16 new QA files had no index line, because the sweep copied the files and skipped the index step. An unlinked file is never loaded, so the sweep lost that knowledge for the next review.

**How to apply:** Run a checker on a `git archive` extract with `python3 -I`. It should report (1) .md files with no link in the role's MEMORY.md, (2) index targets that do not exist, (3) frontmatter missing name, description or metadata.type, (4) symlinks. Count unlinked files as Medium. Check lines lost from each index with `git diff origin/main <head> -- <MEMORY.md>`. Read the whole pre-existing text of every touched file for guard-evasion or bypass wording, because such a line can predate the PR and still sit in a file the PR edits. Sweep completeness across the worktrees is a separate question, and the PR diff cannot answer it. See [[worktree-git-guard]] and [[escaped-defects]].
