# ADR-0027: status data goes to a data branch, not a daily PR

Status: accepted · 2026-10-17 · Supervisor (R-004)

## Context
`docs/spec/06-architecture.md` 5.7 has `status.yml` open a daily PR that auto-merges when checks pass. PRs opened with `GITHUB_TOKEN` do not trigger other workflows, so the required checks never run and the PR cannot merge. Auto-merge also conflicts with R-111 (only the Supervisor merges), and a daily PR is noise.

## Decision
`status.yml` writes `status.json` to the orphan branch `status-data` (one file, one commit per day, `contents: write` on that job only). No PR, no token beyond `GITHUB_TOKEN`. The site still reads `status.json` at build time: the production build and deploy workflow in the private applications repo (ADR-0016) fetches the file from `status-data` (this repo is public, so no token is needed) into `public/` before the build. Preview builds in this repo (`deploy.yml`) skip it, and the footer shows no status line when the file is absent. `main` is never written by the workflow.

## Consequences
- The ruleset for `main` is untouched; `status-data` carries no code and is never built from.
- `docs/spec/06-architecture.md` 5.7 is updated to match; `10-cicd.md` already lists `status.yml` as daily and needs no change.
- If the fetch is missing from the private workflow, production shows no status line and nothing errors, so the Phase 7 checklist must include it.
- Security reviews `status.yml` (ADR-0026).

## Alternatives
- Keep the daily PR with auto-merge: its checks never run on a `GITHUB_TOKEN` PR, and auto-merge conflicts with R-111.
- Open the PR with a PAT or GitHub App token: a new secret to manage and a daily PR the Supervisor must merge, for one JSON file.
- Commit straight to `main`: breaks the ruleset (signed commits, required checks, no bypass).
