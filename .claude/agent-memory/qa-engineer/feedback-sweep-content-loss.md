---
name: sweep-content-loss
description: Memory sweep PRs can pass the index check while dropping committed memory text or adding guard-evasion wording. Checked on PR #223 (head 97f1516).
metadata:
  type: feedback
---

A memory sweep PR can pass every index and frontmatter check and still delete sections that main already had, and add or keep wording that teaches an agent to get past a hook or guard. Diff each touched file against origin/main by removed lines, not only the index.

**Why:** PR #223 (issue #222) passed the checker with 0 problems. It still deleted a PR #182 section from the security checklist, a "Retired mechanisms" check from docs-review-checks, and a ruleset check from reference_review_mechanics, and it added a `gh auth token` concatenation workaround. The sweep copied older worktree copies over newer main text.

**How to apply:** for each touched file, run `git diff origin/main <head> -- <file>` and list every `-` line. For each removed line, grep the head for a distinctive term from it. Read the new and kept text for "bypass", "workaround", "concatenat", "chr()", "script file" and "write-created". Flag a removed control as Medium and a hook-evasion line as High. See [[feedback-memory-sweep-review-checks]] and [[worktree-git-guard]].
