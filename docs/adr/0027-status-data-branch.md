# ADR-0027: status data goes to a data branch, not a daily PR

Status: accepted · 2026-10-17 · Supervisor (R-004)

## Context
`docs/spec/06-architecture.md` 5.7 has `status.yml` open a daily PR that auto-merges when checks pass. PRs opened with `GITHUB_TOKEN` do not trigger other workflows, so the required checks never run and the PR cannot merge. Auto-merge also conflicts with R-111 (only the Supervisor merges), and a daily PR is noise.

## Decision
`status.yml` writes `status.json` to the orphan branch `status-data` (one file, one commit per day, `contents: write` on that job only). No PR, no token beyond `GITHUB_TOKEN`. The site still reads `status.json` at build time: the Phase 7 deploy workflow fetches the file from `status-data` into `public/` before the build, and the footer shows no status line when the file is absent. `main` is never written by the workflow.

## Consequences
- The ruleset for `main` is untouched; `status-data` carries no code and is never built from.
- The spec lines in 5.7 and 10-cicd.md are updated to match.
- Security reviews `status.yml` (ADR-0026).
