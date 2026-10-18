# CI/CD

Pipelines and the checks that enforce the rules in `docs/rules.md`. Owned by the Platform Engineer; workflow changes need Security review. Every failing check must print the rule ID it enforces.

### 10.1 On every pull request (`ci.yml`)
1. Checkout (pinned SHA), setup Node from `.nvmrc`, `npm ci --ignore-scripts`.
2. Format check, lint, Stylelint, type check, `astro check`.
3. Content validation and claims check.
4. Unit and component tests with coverage gate.
5. Build, including résumé PDFs.
6. html-validate and lychee on the build output.
7. Playwright e2e, accessibility and visual tests against the build.
8. Lighthouse CI with budgets.
9. gitleaks, OSV-Scanner, npm audit.
10. Upload the built site as a workflow artifact for review.
All jobs required for merge.

### 10.2 Other workflows
`review-gate.yml`, `branch-name.yml`, `pr-hygiene.yml` and `labeler.yml` (PR process checks, section 3.5), `codeql.yml` (PRs and weekly), `scorecard.yml` (weekly), `status.yml` (daily), `release.yml` (release-please, tags, changelog, SBOM), `deploy.yml` (preview deploys on PRs, fixtures only). Production build, deploy and the monthly expired `/for` cleanup run in the private applications repo (ADR-0016).

### 10.3 Environments
- Local: `npm run dev` and `npm run preview` (production build with emulated headers).
- Production (Phase 7): Cloudflare Pages on `rohanjain.pro`, deployed from release tags. Instant rollback documented.

## Checks to build, by rule
Generated from `docs/rules.md`. Hooks marked active already exist in `.claude/hooks/`; this table lists what CI, rulesets and git hooks must add.

| Rule | Check to build | Phase |
|---|---|---|
| R-007 | guard-write hook (src/, public/); copy lint in CI | phase-1 |
| R-008 | guard-write hook; copy lint in CI | phase-1 |
| R-010 | copy lint in CI | phase-1 |
| R-101 | ruleset; guard-bash hook; Husky pre-push | phase-0 |
| R-102 | ruleset; guard-bash hook | phase-0 |
| R-103 | guard-bash hook; branch-name CI check | phase-1 |
| R-104 | pr-hygiene CI check | phase-1 |
| R-105 | commitlint (Husky and CI) | phase-1 |
| R-106 | guard-bash hook; Husky commit-msg | phase-1 |
| R-107 | ruleset | phase-0 |
| R-108 | pr-hygiene CI check | phase-1 |
| R-109 | pr-hygiene CI check | phase-1 |
| R-111 | guard-bash hook; ruleset (squash only, required checks, no bypass) | phase-0 |
| R-201 | review-gate CI check; ruleset | phase-1 |
| R-202 | review-gate CI check; guard-bash hook | phase-1 |
| R-206 | Retired (ADR-0026) | none |
| R-207 | review-gate CI check for a Checked: section | phase-1 |
| R-208 | review-gate CI check (Head must equal PR head) | phase-1 |
| R-209 | labeler CI | phase-1 |
| R-301 | check-claims CI | phase-1 |
| R-303 | CI completeness check | phase-1 |
| R-304 | CI scan of build output | phase-2 |
| R-305 | CI test on build output | phase-2 |
| R-401 | ESLint restricted globals; property tests | phase-1 |
| R-402 | ESLint no-restricted-syntax in runtime engine code; ReDoS test | phase-3 |
| R-403 | property test | phase-3 |
| R-404 | pr-hygiene CI check | phase-3 |
| R-405 | ESLint; property render test | phase-1 |
| R-406 | alias audit test | phase-3 |
| R-501 | guard-bash hook on git add; .gitignore; pre-commit; gitleaks rule | phase-1 |
| R-502 | Zod schema rejects extra fields | phase-4 |
| R-503 | unit and e2e tests | phase-4 |
| R-504 | action-pin CI check | phase-1 |
| R-505 | headers CI test | phase-1 |
| R-506 | labeler; pr-hygiene CI check | phase-1 |
| R-507 | CI | phase-1 |
| R-508 | gitleaks pre-commit and CI; GitHub push protection | phase-0 |
| R-511 | phase-gate script checks open severity labels; Security veto | phase-1 |
| R-512 | CSP test; e2e test | phase-5 |
| R-513 | guard-bash hook exact-command match; hook tests | phase-4 |
| R-601 | Stylelint rules; copy lint | phase-1 |
| R-603 | copy lint CI | phase-1 |
| R-605 | e2e JS-disabled test | phase-2 |
| R-606 | axe CI | phase-2 |
| R-607 | Lighthouse CI | phase-2 |
| R-608 | Stylelint max duration; e2e reduced-motion check | phase-1 |
| R-609 | labeler; review-gate | phase-1 |
| R-610 | guard-write hook; docs lint | active |
| R-701 | pr-hygiene CI flags removed tests; labeler | phase-1 |
| R-702 | Stryker CI | phase-3 |
| R-703 | Vitest CI | phase-1 |
| R-704 | Retired after audit 1 (ADR-0026) | none |
| R-804 | phase-gate script | phase-1 |
| R-805 | docs lint rejects task checklists in docs/spec/ | active |
| R-806 | docs lint | active |
| R-807 | Retired (ADR-0026) | none |
| R-902 | apps script test | phase-8 |

Also wire into CI from Phase 1: `node scripts/lint-docs.mjs` (R-806) and `node .claude/hooks/test-hooks.mjs` whenever `.claude/` changes (the hooks self-test).
