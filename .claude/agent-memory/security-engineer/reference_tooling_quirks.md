---
name: tooling-quirks
description: Environment quirks that break review commands (gh pr edit labels, em-dash hook, worktree git guard)
metadata:
  type: reference
---

- `gh pr edit --add-label/--remove-label` fails with a "Projects (classic) is being deprecated" GraphQL error. Use REST instead: `gh api -X DELETE repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels/<label>`, or `gh api -X POST .../issues/<n>/labels -f 'labels[]=approved:security'`.
- The R-008 Write hook rejects any literal em dash, even inside a grep pattern in a review body. Write the pattern as `grep -nP "\x{2014}"`.
- The worktree guard rejects compound git commands (loops, `&&` chains that start with `git checkout`). Run each git command as its own Bash call, and read `git diff origin/main...<sha>` instead of looping over `git show`.

Related: [[review-checklist-escaped-defects]]
