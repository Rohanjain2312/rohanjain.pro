---
name: worktree-verify-hygiene
description: Keep reviewer scratch files out of the worktree so `npm run verify` can stamp; git guard refuses compound commands that mix git with other steps
metadata:
  type: feedback
---

Write logs, fetched files and scratch text to the session scratchpad, never inside the worktree. Run `npm run verify` only on a clean tree.

**Why:** On the PR #84 review, `npm run verify` passed every step but refused to write the stamp because my `.qa-verify.log` made the tree dirty (R-110). Separately, the worktree guard refused a compound shell command that combined a `cd`, a loop and git calls. It asked for plain, separate commands.

**How to apply:** Redirect verify output to the scratchpad. Check `git status --short` before verify, and run it again after any stray file is removed. Split git work into one plain command per call. When checking out a PR head for review, remember to switch back to the worktree branch and delete the temporary local ref afterwards.

Related: [[project-qa-tooling-gaps]].
