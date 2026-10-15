---
name: run-review
description: Use whenever a PR is ready for review. Explains which reviewers a PR needs, how to delegate to them without sharing the builder's reasoning, the review comment format, and merge steps.
---

# Running reviews

## Who reviews
Read the PR labels. Required: `supervisor` always; `design-lead` for `needs:design-review`; `security-engineer` for `needs:security-review`; `qa-engineer` for `needs:qa-review`; `reader-advocate` for `needs:reader-review`.

## Delegating
- **R-204** A review delegation contains only the PR number, head SHA, acceptance criteria and plan references; never the builder's report or reasoning.
- **R-205** Reviews run in order: CI, QA, Security, Design Lead, Reader Advocate, Supervisor; each reviewer posts before reading others' reviews.

Delegation template (copy exactly, fill the brackets, add nothing else):

```
Review PR #<n> at head <sha>.
Acceptance criteria: <paste from issue #<i>>.
Relevant spec: <file and section>.
Post one comment with `gh pr comment <n> --body-file <file>` in this format:
REVIEW: APPROVED | CHANGES REQUESTED
Reviewer: <your agent name>
Head: <sha>
Agent: <your agent id>
Checked:
- <what you checked, with the command or screenshot>
Findings:
- <severity>: <finding> (or "none")
If you approve, add the label approved:<role>.
```

"Checked" must list at least three items when there are no findings (R-207).

## After reviews
- CHANGES REQUESTED: send the findings to the builder, who fixes and pushes. The new head invalidates old approvals (R-208); re-run the reviews that are required.
- All approvals present and CI green: post the Supervisor review, then `gh pr merge <n> --squash --delete-branch`. Update `docs/status.md`.
