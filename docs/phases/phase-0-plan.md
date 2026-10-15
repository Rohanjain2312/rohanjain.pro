# Phase 0 plan: Inception and governance

**Goal:** the repository, rules, decisions and backlog are in place so Phase 1 can start without open questions.

## Issues
| Issue | Owner | Output |
|---|---|---|
| #1 Bootstrap repository | supervisor | Client setup files on `main` via PR #2; `main` created per ADR-0013 |
| #3 Repository templates and CODEOWNERS | platform-engineer | Issue and PR templates, CODEOWNERS, `docs/runbooks/repo-settings.md` |
| #4 ADRs 0001 to 0012 | supervisor | `docs/adr/` |
| #5 Threat model | security-engineer | `docs/security/threat-model.md` |
| #6 Design spec outline | design-lead | `docs/design/spec.md` outline |
| #7 Phase 0 plan and Phase 1 backlog | supervisor | This file, Phase 1 issues, `docs/needs-client.md` update, path ownership for Phase 1 configs |
| #8 Probe test after Phase 0 | qa-engineer | `docs/qa/probe-results.md` |

Done by the Supervisor directly with `gh` (recorded in #3's runbook): repo description, topics, homepage, merge settings (squash only, delete branch on merge), ruleset "main protection" (no deletion, no force push, linear history, signed commits, PR required, squash only, no bypass), secret scanning and push protection, Dependabot alerts and security fixes, private vulnerability reporting, labels, milestones Phase 0 to 6, repo-local SSH commit signing.

## Risks
- No CI exists yet, so Phase 0 PRs rely on hooks and reviews only. Mitigation: Phase 1 builds CI first.
- The GitHub CLI token lacks the `project` and `admin:ssh_signing_key` scopes, so the project board and verified branch signatures wait on the client (`docs/needs-client.md`). Neither blocks the build: `main` commits are squash merges signed by GitHub.
- `gh pr edit` fails on the installed gh 2.63.2 (Projects classic deprecation). Workaround: add labels with `gh api repos/<repo>/issues/<n>/labels`. The R-203 label check in `guard-bash.mjs` only inspects `gh pr edit`, so the label API path is unchecked until the review-gate CI check exists in Phase 1.
