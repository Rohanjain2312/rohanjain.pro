---
name: verify-on-rebased-merge
description: Before approving, re-run verify on the PR head merged with current origin/main. A green head can fail after main gains new gates.
metadata:
  type: feedback
---

Before posting an APPROVED review, check whether origin/main has moved past the PR's base. If it has, trial-merge origin/main into the PR head with `git merge --no-commit`, run the verify steps on the merged state, then `git merge --abort`.

**Why:** PR #84 passed `npm run verify` at its head (fa2361b). Main then gained #85, which added `prettier --check .` to verify. The README and CONTRIBUTING files were not formatted, so the rebased PR fails verify. R-110 and DoD item 3 then block the merge. The earlier QA rounds missed it because the gate did not exist yet on their base.

**How to apply:** At the start of each review, run `git ls-remote origin refs/heads/main` and compare it with the PR base. If main moved, do the trial merge and run every verify step (`docs:lint`, `format:check`, `lint`, `lint:css`, `lint:selftest`, `check`, `test`, `build`, `test:e2e`). Do not use `git merge` with a compound `cd && git` form, since the sandbox rejects it. Use `git -C <worktree>` instead. See [[defects-escaped-review]].
