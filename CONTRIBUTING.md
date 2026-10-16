# Contributing

This site is built by a team of Claude Code agents under a Supervisor. The rules below apply to every change. Each has an ID in [`docs/rules.md`](docs/rules.md); many are caught by hooks in `.claude/hooks/` (tripwires for common violations, ADR-0018), and CI will check them on every pull request (issue #13). If a check blocks you, its message names the rule. Fix the cause; never work around a check.

## Workflow

1. Every unit of work is a GitHub Issue with an owner role, acceptance criteria and a phase milestone.
2. One issue, one branch, one pull request (R-104). Builders work in their own git worktree (R-114).
3. Run `npm run verify` on the final commit. Open the pull request as a draft and mark it ready only after verify passes on its current head (R-110).
4. Reviewers check the pull request and post review comments. The Supervisor merges.

## Branches

`<role>/<issue>-<slug>`, for example `frontend/14-hero-section` (R-103). The role prefix must match the agent creating the branch: `supervisor`, `design`, `frontend`, `appdata`, `platform`, `security`, `qa`, `reader`. Nobody pushes to `main` (R-101). Force-push only with `--force-with-lease` on your own branch (R-102).

## Commits

- Conventional Commits with the issue number, for example `feat(hero): add results strip (#14)` (R-105).
- Every commit message ends with the trailer `Agent-Role: <role>` matching the agent that commits (R-106).
- Commits on `main` are signed (R-107). Never skip hooks (R-116).

## Pull requests

- Title: `[<role>] <type>(<scope>): <summary> (#<issue>)` (R-108).
- Body: contains `Closes #<issue>` (R-104), what changed, and the test plan with its output.
- Size: under 600 changed lines unless the Supervisor adds `size:approved` with a reason (R-109).
- A new dependency needs a justification in the pull request and a Security review (R-506).

## Reviews

- Labels from the changed paths decide the reviewers (R-209): `needs:design-review`, `needs:security-review`, `needs:qa-review`, `needs:reader-review`. The Supervisor reviews every pull request.
- Reviews run in order: CI, QA, Security, Design Lead, Reader Advocate, Supervisor (R-205). Each review is one comment in the format from the `run-review` skill (`.claude/skills/run-review/SKILL.md`), and an approval adds the label `approved:<role>`.
- A new commit invalidates earlier approvals (R-208).
- Only the Supervisor merges, by squash, deleting the branch (R-111).

## Definition of done

A pull request is done when it meets all eight items listed in [`docs/spec/03-workflow.md`](docs/spec/03-workflow.md).

## Content

Every number on the site traces to a source in the Evidence Ledger ([`docs/spec/05-evidence-ledger.md`](docs/spec/05-evidence-ledger.md)). Never invent numbers, dates, claims or copy (R-005).
