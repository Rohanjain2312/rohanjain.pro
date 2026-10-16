---
name: reference-tooling-gotchas
description: Working around the worktree git guard, gh pr edit's Projects deprecation error, and shared dev-server ports during QA reviews.
metadata:
  type: reference
---

- **Worktree git guard:** a Bash command is refused if it mixes `cd` with a git-looking token. The `.github` path also trips it, as does `git checkout`. Use one plain command per call with absolute paths. Extract a PR head with `git archive <sha> | tar -x -C <scratch>` (this works), and never check out a PR head in the builder's worktree.
- **`gh pr edit --add-label` fails** (exit 1) with a Projects (classic) GraphQL deprecation message, and the label is not added. Use `gh api -X POST repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels -f 'labels[]=<label>'`. Confirm with `gh pr view --json labels`.
- **Dev server ports are shared** with other agent sessions. `astro dev` daemonizes, and `astro dev stop` from a different prefix reports "no dev server". Start on a unique port, find the listener with `lsof -nP -iTCP:<port> -sTCP:LISTEN`, and kill only your own PID.
- **Prettier:** `.prettierignore` skips `docs/`, `.claude/` and `reference/`. CI runs `prettier --check .`, not a file list. Passing a no-extension file such as LICENSE by name errors; the directory form does not.
- **Scratch installs:** `npm ci --ignore-scripts` in a fresh scratch copy takes about 5 seconds and lets `npm run verify` run on a PR tree without touching the worktree.

Related: [[link-and-copy-lint-pending]].
