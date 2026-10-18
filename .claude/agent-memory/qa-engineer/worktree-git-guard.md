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
- `git -C $R ...` where `$R` is a shell variable (PR #200). Use the literal worktree path.
- `git grep -P "\x{2014}"`: git reports a PCRE error. Type the literal character inside double quotes instead.

It accepted these:
- Plain `git show <literal-sha>:path`, one per call.
- `git -C /absolute/worktree/path grep -n "literal" <literal-ref> -- <paths>` (PR #200).
- `git archive <literal-sha> | tar -x -C <scratch-dir>` for a full tree copy. Use the scratch directory given in the session environment. Pass the paths as well to extract a subset (`git archive <sha> tests/visual/screenshots src/styles | tar -x -C <scratch>`).
- Literal characters in grep patterns, typed directly into the command. Put Unicode characters inside double quotes.
- `gh` commands, and `npm` and `node` commands run inside the scratch copy.
- A venv in the scratchpad for Python checks: `python3 -m venv <scratch>/venv && <scratch>/venv/bin/pip install fonttools brotli`, then `<scratch>/venv/bin/python -I <script>` with the script written by the Write tool. Font cmap checks on the five woff2 files took under a second.

- Also refused: a Bash command line that mentions a path containing `.github` next to other steps. Report the refusal in the review; do not restructure the command to get past the guard.

Note: the R-008 hook blocks any file write that contains the em dash character, including memory files. Write dashes as commas, colons or parentheses.

**Why:** the guard blocked the PR-84 review on the first attempts. Split commands worked. PR #200 added the `git -C` and archive-subset forms.
**How to apply:** for a PR head, run `git fetch origin <literal-sha>`, then `git archive <literal-sha> | tar -x -C <scratch>/prN`. Run every check from scratch with simple commands. Do not use the worktree for checks at a PR head. Note that `git fetch origin <a> <b>` sets FETCH_HEAD to the first ref, so fetch the PR head by its literal SHA.
- Refused (PR #202): a `cd <worktree> && for ...; do cat ...; done` compound with no git command in it. Split into plain single calls.
- `git archive <literal-sha> | tar -x -C <scratch-dir>` for a full tree copy. Use the scratch directory given in the session environment.
**Why:** the guard blocked the PR-84 review on the first attempts. Split commands worked.
**How to apply:** for a PR head, run `git fetch origin <literal-sha>`, then `git archive <literal-sha> | tar -x -C <scratch>/prN`. Run every check from scratch with simple commands. Do not use the worktree for checks at a PR head.
