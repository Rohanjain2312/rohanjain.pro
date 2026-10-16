---
name: worktree-git-guard
description: How to run git and shell checks as a worktree-isolated QA agent without tripping the git guard. Read before running git commands in a review.
metadata:
  type: reference
---

The worktree guard refuses git commands it cannot verify stay inside the worktree. It refused these forms:
- `git show $SHA:path` where SHA is a shell variable.
- Loops or compound commands that call `git` through a variable or `$(...)`.
- Shell constructs such as ANSI-C quoting (`$'...'`) in a grep pattern.

It accepted these:
- Plain `git show <literal-sha>:path`, one per call.
- `git archive <literal-sha> | tar -x -C <scratch-dir>` for a full tree copy. Use the scratch directory given in the session environment.
- Literal characters in grep patterns, typed directly into the command. Put Unicode characters inside double quotes.
- `gh` commands, and `npm` and `node` commands run inside the scratch copy.

Note: the R-008 hook blocks any file write that contains the em dash character, including memory files. Write dashes as commas, colons or parentheses.

**Why:** the guard blocked the PR-84 review on the first attempts. Split commands worked.
**How to apply:** for a PR head, run `git fetch origin <literal-sha>`, then `git archive <literal-sha> | tar -x -C <scratch>/prN`. Run every check from scratch with simple commands. Do not use the worktree for checks at a PR head.
