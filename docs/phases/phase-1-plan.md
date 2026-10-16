# Phase 1 plan: Foundations

**Goal:** a green pipeline with every Phase 1 gate wired, an empty styled page that builds, headers verified locally, and validated, QA-verified content.

## Issues and order
| Wave | Issue | Owner |
|---|---|---|
| 1 | #10 Astro scaffold and toolchain | platform-engineer |
| 1 | #19 Design spec complete | design-lead |
| 1 | #30 README, CONTRIBUTING and LICENSE | supervisor |
| 2 | #11 Lint, format and style gates | platform-engineer |
| 2 | #12 Git hooks: Husky, lint-staged, commitlint, gitleaks | platform-engineer |
| 2 | #17 Local header emulation in preview | platform-engineer |
| 2 | #20 Design tokens | design-lead |
| 2 | #22 Content collections and schemas | app-data-engineer |
| 2 | #27 Copy lint | qa-engineer |
| 3 | #13 CI pipeline (ci.yml) | platform-engineer |
| 3 | #16 Phase gate script and docs checks in CI | platform-engineer |
| 3 | #18 Security headers and CSP | security-engineer |
| 3 | #21 Base styles, fonts and empty styled page | frontend-engineer |
| 3 | #23 claims.json from the Evidence Ledger | app-data-engineer |
| 3 | #24 skills.json, roles.json and site.json | app-data-engineer |
| 4 | #14 PR process checks and required checks | platform-engineer |
| 4 | #15 Security and release workflows | platform-engineer |
| 4 | #25 resume.json from the résumé | app-data-engineer |
| 4 | #26 Claims check (check-claims) | app-data-engineer |
| 4 | #28 Claims verification | qa-engineer |
| 4 | #29 Headers test | qa-engineer |
| 5 | #31 Seeded-defect audit 1 | qa-engineer |

Issues in a wave can run in parallel; each depends only on earlier waves.

## Risks
- `package.json` is shared by Platform, Frontend, App/Data and QA. Mitigation: Platform lands the scaffold first; later PRs rebase and keep script changes small.
- Until #14 lands, review approvals are checked only by hooks. Mitigation: #14 is the first issue in wave 4 and updates the ruleset's required checks.
- The résumé links the settlement demo to a local file path (Security review of PR #2). Mitigation: `resume.json` uses the public https URL; noted on #25.
