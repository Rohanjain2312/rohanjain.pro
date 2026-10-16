# Phase 0 demo: Inception and governance

Phase 0 has no visible site, so there are no screenshots. The demo is the repository itself.

## What exists now
- **Repository:** public, squash-only, branches deleted on merge, description, topics and homepage set. Ruleset "main protection": no deletion, no force push, linear history, PR required, squash only, signed commits, no bypass. Secret scanning, push protection, Dependabot alerts and security fixes, private vulnerability reporting, SHA-pinned Actions, interaction limit `collaborators_only` until 2027-04-16, fork PR approval for all outside contributors. Recorded in `docs/runbooks/repo-settings.md`.
- **Tracking:** labels, milestones Phase 0 to 8, issue and PR templates, CODEOWNERS, project board "rohanjain.pro build" (https://github.com/users/Rohanjain2312/projects/1) with a Stage field.
- **Decisions:** ADR-0001 to ADR-0018 in `docs/adr/`.
- **Security:** threat model (`docs/security/threat-model.md`), Phase 0 review log (`docs/security/reviews/phase-0.md`), seven Medium findings found and closed.
- **Design:** design spec outline (`docs/design/spec.md`) and the decisions on its open questions (ADR-0015).
- **Guardrails:** `guard-bash.mjs` grew from 54 to 125 hook tests; `.npmrc` turns off install scripts; Dependabot with a 7-day cooldown.
- **Plans:** `docs/phases/phase-0-plan.md`, `docs/phases/phase-1-plan.md`, and 22 Phase 1 issues (#10 to #31) with acceptance criteria.

## Merged PRs
#2, #34, #35, #36, #37, #48, #49, #52, #53, #55, #65, #67, #68, #71, and the review log PR #40.
