# ADR-0009: Public repo, trunk-based, signed commits

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The repo itself is evidence of how Rohan works, and the client chose public visibility (client decision 6). Several agents share one GitHub account.

## Decision
The repo is public from day one. Trunk-based: short-lived branches `<role>/<issue>-<slug>`, one issue per PR, squash merges only into `main` (R-101 to R-111). A GitHub ruleset on `main` blocks deletion and force pushes, requires PRs, linear history and signed commits (paused by ADR-0014 until the signing key is uploaded), and allows squash only. Local commits are signed with SSH; squash merges are signed by GitHub. Secret scanning, push protection and Dependabot alerts are on.

## Consequences
- Every change is reviewable and attributable through PRs and `Agent-Role` trailers.
- Secrets and posting text must never be committed (R-501, R-508); scanning backs this up.
- Branch commits show as verified on GitHub only once the SSH signing key is uploaded (`docs/needs-client.md`); `main` is unaffected because GitHub signs squash merges.

## Alternatives
- Private until launch: hides the work that recruiters can inspect.
- Long-lived develop branch: slower, more merge conflicts.
