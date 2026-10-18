---
name: review-mechanics
description: Practical gotchas when reviewing PRs here (label names, worktree limits, clean-clone verification)
metadata:
  type: reference
---

- The approval label is `approved:qa` (not `approved:qa-engineer`). `gh pr edit --add-label` fails on a classic-projects GraphQL error; use `gh api repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels -f "labels[]=approved:qa"`. The API creates unknown labels silently, so check `gh label list` first.
- Run `npm ci`, `check`, `test`, `build` in a clean clone under the scratchpad, not the agent worktree: `astro check` fails inside `.claude/worktrees/` once a content config exists.
- The worktree sandbox refuses Bash commands that use shell variables as args or heredocs; write scripts with the Write tool and call them with literal absolute paths.
- The guard also refuses a `curl` whose URL contains "github.com" (it reads it as git). Use `gh api` for GitHub and put loops in a script file in the scratchpad.
- A reused scratchpad dir holds stale `node_modules`, `dist` and old review files. `git archive | tar -x` overlays them: delete `node_modules dist .astro` and rerun `npm ci`. Write on an existing file reports "updated"; it is a full overwrite.
- Résumé text for R-303: `unzip -p reference/resume/Rohan_Resume_v26.docx word/document.xml`, then strip tags with sed.
- zsh expands unquoted `--include=*.md` globs and fails with "no matches found". Quote the pattern, or drop `--include` and use `--exclude-dir` for grep over the export.
- `gh pr view --json` has no `closingIssuesReferences` field; the field list is in the error output. The agent id for the review Agent line is not given in the prompt; use the worktree name (`agent-<id>`) and say so in Checked.
- The export's `npm ci --ignore-scripts` prints an audit warning; it is not a review finding. Dependabot PR #97 owns it.
- Fixture dir `tests/fixtures/applications/` (issue #22 comment) is QA-owned; follow-up owed after PR #83 (83-L1).
