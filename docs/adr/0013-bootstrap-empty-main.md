# ADR-0013: Bootstrap main with an empty root commit

Status: accepted · Date: 2026-10-15 · Issue: #1

## Context
The GitHub repository was empty. R-101 blocks pushing to `main`, and a pull request needs an existing base branch with shared history. The first PR (#1) could not be opened without a `main`.

## Decision
Create one empty root commit (no files) locally with `git commit-tree`, rebase `supervisor/1-bootstrap` onto it, push the branch, and point `refs/heads/main` at the empty root commit through the GitHub API. All content reaches `main` through the squash-merged bootstrap PR.

## Consequences
- `main` holds no content that skipped review.
- This is a one-time step. After it, R-101 applies with no exception, and the ruleset set up in Phase 0 enforces it on GitHub.

## Alternatives
- Push the bootstrap branch as the default branch and rename it: the bootstrap would land on `main` without a PR.
- Ask the client to create `main`: violates R-002.
