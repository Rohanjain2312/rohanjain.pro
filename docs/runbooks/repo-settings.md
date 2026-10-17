# Runbook: repository settings

Records the live configuration of `Rohanjain2312/rohanjain.pro` as of 2026-10-16. The Supervisor owns the settings. This file only records them. Re-verify with the commands at the end.

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
| pull_request | 0 required approvals, stale reviews dismissed on push, squash only, `require_extra_approval_for_unattributed_changes` true |
| required_signatures | on |

Approvals are `approved:<role>` labels checked by `review-gate`, because GitHub does not let an account approve its own PR (docs/spec/03-workflow.md).

`required_signatures` is on (restored 2026-10-16 by PR #68, issue #33; ADR-0014 is superseded). Do not remove it.

### Required status checks (R-111, R-201)

Added by the Supervisor after the PR for issue #14 merges, with the command in that PR's body. Each check is pinned to the GitHub Actions app (`integration_id` 15368), so no other app can post a passing status. `strict_required_status_checks_policy` is false. There is no bypass actor.

| Check | Workflow | Rules |
|---|---|---|
| `policy`, `static`, `content`, `test`, `build`, `e2e`, `security` | `ci.yml` | see `docs/spec/10-cicd.md` 10.1 |
| `review-gate` | `review-gate.yml` | R-201, R-202, R-207, R-208, R-609 |
| `branch-name` | `branch-name.yml` | R-103 |
| `pr-hygiene` | `pr-hygiene.yml` | R-104, R-108, R-109, R-404, R-506, R-701 |
| `labeler` | `labeler.yml` | R-209 |

Until the Supervisor applies the command, the live ruleset has no required status checks.

### How review-gate works

- Reviews are PR comments from the repo owner in the `run-review` format. Post the comment first, then add the `approved:<role>` label. The label event re-runs the check. If the label came first, re-run the check from the Actions tab or remove and re-add the label.
- Required reviews: `supervisor` always, plus one per `needs:*-review` label. The check also derives those labels from the changed paths, so a removed label does not remove the requirement.
- The path-to-label map is `.github/labeler.json` (R-209). To change it, edit that file in a PR. It needs Security review.
- Draft PRs pass with a note. The check starts enforcing when the PR is marked ready.
- The workflows run the script from the base commit of the PR. A PR that edits `.github/scripts/pr-process.mjs` is checked by the old script and the change takes effect after merge.
- Self-tests: `npm run gates:test`.

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

## Actions controls

| Control | Value |
|---|---|
| Actions | enabled, all actions allowed |
| Default workflow permissions | read |
| Actions can approve PRs | no |
| Fork PR approval | required for first-time contributors |
| `sha_pinning_required` | true (actions must be pinned to a full commit SHA) |

## Labels

All 50 labels, from `gh label list --limit 100`:

- Phase: `phase-0` to `phase-8`.
- Role: `role:design-lead`, `role:supervisor`, `role:app-data-engineer`, `role:frontend-engineer`, `role:platform-engineer`, `role:qa-engineer`, `role:security-engineer`, `role:reader-advocate`.
- Type: `type:feat`, `type:chore`, `type:fix`, `type:docs`, `type:ci`, `type:test`, `type:refactor`, `type:security`.
- Review needed (R-209): `needs:security-review`, `needs:qa-review`.
- Approved (R-202): `approved:supervisor`, `approved:design`, `approved:security`, `approved:qa`, `approved:reader`.
- Severity: `severity:critical`, `severity:high`, `severity:medium`, `severity:low`, `severity:info`.
- Other: `size:approved` (Supervisor approved a PR over 600 lines), `accessibility` (barrier affecting people with disabilities).
- GitHub defaults kept: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`.

## Milestones

`Phase 0` to `Phase 8`, all open, no due dates.

## Known gh issue

`gh pr edit` fails with gh 2.63.2 (Projects classic GraphQL error). Add labels with:

```
gh api -X POST repos/Rohanjain2312/rohanjain.pro/issues/<n>/labels -f 'labels[]=<label>'
```

## Verify

```
gh api repos/Rohanjain2312/rohanjain.pro
gh api repos/Rohanjain2312/rohanjain.pro/rulesets/25204664
gh api repos/Rohanjain2312/rohanjain.pro/actions/permissions
gh api repos/Rohanjain2312/rohanjain.pro/actions/permissions/workflow
gh api repos/Rohanjain2312/rohanjain.pro/actions/permissions/fork-pr-contributor-approval
gh api repos/Rohanjain2312/rohanjain.pro/vulnerability-alerts -i
gh api repos/Rohanjain2312/rohanjain.pro/private-vulnerability-reporting
gh label list --limit 100
gh api 'repos/Rohanjain2312/rohanjain.pro/milestones?state=all'
```
