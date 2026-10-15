# Runbook: repository settings

Records the live configuration of `Rohanjain2312/rohanjain.pro` as of 2026-10-15. The Supervisor owns the settings. This file only records them. Re-verify with the commands at the end.

## General

| Setting | Value |
|---|---|
| Visibility | public |
| Default branch | `main` |
| Description | Portfolio of Rohan Jain: ML Engineer, AI Engineer, Data Scientist. Static Astro site built by a team of Claude Code agents. |
| Homepage | https://rohanjain.pro |
| Topics | ai-engineer, astro, claude-code, cloudflare-pages, data-science, machine-learning, portfolio |
| Issues | enabled |
| Projects | enabled |
| Wiki | disabled |

## Merge options

| Option | Value |
|---|---|
| Squash merge | allowed (only method) |
| Merge commit | disabled |
| Rebase merge | disabled |
| Squash commit title | PR title |
| Squash commit message | PR body |
| Auto-merge | allowed |
| Delete branch on merge | on |
| Update branch button | off |

## Ruleset "main protection" (id 25204664)

Target: default branch. Enforcement: active. Bypass actors: none.

| Rule | Value |
|---|---|
| deletion | blocked |
| non_fast_forward | blocked (no force push) |
| required_linear_history | on |
| pull_request | 0 required approvals, stale reviews dismissed on push, squash only |
| required_signatures | paused (see below) |

Approvals are `approved:<role>` labels checked by `review-gate`, because GitHub does not let an account approve its own PR (docs/spec/03-workflow.md).

Required signatures are paused per `docs/adr/0014` (PR #34) and issue #33. Do not re-enable the rule without reading the ADR.

Required status checks are not yet in the ruleset. They are added once the Phase 1 workflows exist.

## Security features

| Feature | Status |
|---|---|
| Dependabot security updates | enabled |
| Dependabot vulnerability alerts | enabled |
| Secret scanning | enabled |
| Secret scanning push protection | enabled |
| Secret scanning non-provider patterns | disabled |
| Secret scanning validity checks | disabled |
| Private vulnerability reporting | enabled |
| Actions | enabled, all actions allowed, SHA pinning not enforced by GitHub |

## Labels

- Phase: `phase-0` to `phase-8`.
- Role: `role:design-lead`, `role:supervisor`, `role:app-data-engineer`, `role:frontend-engineer`, `role:platform-engineer`, `role:qa-engineer`, `role:security-engineer`, `role:reader-advocate`.
- Type: `type:feat`, `type:chore`, `type:fix`, `type:docs`, `type:ci`, `type:test`, `type:refactor`, `type:security`.
- Review needed (R-209): `needs:design-review`, `needs:security-review`, `needs:qa-review`, `needs:reader-review`.
- Approved (R-202): `approved:supervisor`, `approved:design`, `approved:security`, `approved:qa`, `approved:reader`.
- Severity: `severity:critical`, `severity:high`, `severity:medium`, `severity:low`, `severity:info`.
- Other: `size:approved` (Supervisor approved a PR over 600 lines).
- GitHub defaults kept: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`.

## Milestones

`Phase 0` to `Phase 6`, all open, no due dates. `Phase 7` and `Phase 8` do not exist yet. Create them when those phases are planned.

## Known gh issue

`gh pr edit` fails with gh 2.63.2 (Projects classic GraphQL error). Add labels with:

```
gh api -X POST repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels -f 'labels[]=<label>'
```

## Verify

```
gh api repos/Rohanjain2312/rohanjain.pro
gh api repos/Rohanjain2312/rohanjain.pro/rulesets/25204664
gh api repos/Rohanjain2312/rohanjain.pro/vulnerability-alerts -i
gh api repos/Rohanjain2312/rohanjain.pro/private-vulnerability-reporting
gh label list --limit 100
gh api 'repos/Rohanjain2312/rohanjain.pro/milestones?state=all'
```
