---
name: review-mechanics
description: Practical gotchas when reviewing PRs here (label names, worktree limits, clean-clone verification)
metadata:
  type: reference
---

- The approval label is `approved:qa` (not `approved:qa-engineer`). `gh pr edit --add-label` fails on a classic-projects GraphQL error; use `gh api repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels -f "labels[]=approved:qa"`. The API creates unknown labels silently, so check `gh label list` first.
- Run `npm ci`, `check`, `test`, `build` in a clean clone under the scratchpad, not the agent worktree: `astro check` fails inside `.claude/worktrees/` once a content config exists.
- The worktree sandbox refuses Bash commands that use shell variables as args or heredocs; write scripts with the Write tool and call them with literal absolute paths.
- Fixture dir `tests/fixtures/applications/` (issue #22 comment) is QA-owned; follow-up owed after PR #83 (83-L1).
