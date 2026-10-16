---
name: tooling-quirks
description: gh and harness behaviors in this repo that waste time if forgotten (gh 2.63.2 issue view and pr edit, worktree command guard)
metadata:
  type: reference
---

- `gh issue view <n>` without `--json` fails (Projects classic deprecation GraphQL error). Use `gh issue view <n> --json title,body,labels`.
- `gh pr edit` is broken on gh 2.63.2. Add labels with `gh api -X POST repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels -f 'labels[]=<label>'`.
- In an isolated worktree, the harness refuses commands with shell variables as node or git operands, multi-step `for` loops around `git show`, and complex `--jq` strings. Use plain commands with literal absolute paths.
- Worktrees can disappear between sessions. Check `git worktree list` and recreate from `origin/main` if needed.

Related: [[severity-calibration]].
