# Engineering workflow

How work moves from issue to merge. The rules themselves are in `docs/rules.md`; most are enforced by hooks and CI.

## Process and Definition of Done
- Phased delivery with automated gates (`docs/spec/11-phases.md`). Each phase is a sprint with a goal and tickets, closed by a plan and a gate record (ADR-0026).
- Every unit of work is a GitHub Issue with: title, owner role, description, acceptance criteria, test plan, security notes, design notes, labels (`phase-N`, `role-*`, `type-*`).
- Definition of Ready: the ticket has acceptance criteria, an owner and no unknown dependencies.
- Definition of Done (all required):
  1. Acceptance criteria met and shown in local screenshots at 390 and 1280 px.
  2. Unit, component and end-to-end tests added or updated; all green.
  3. Lint, type check, format, accessibility, link and Lighthouse gates green.
  4. No new security findings above Low; Security review recorded where required.
  5. Design review recorded for any visible change.
  6. Docs updated (README, ADR, runbook, changelog as relevant).
  7. Content integrity check green: every number traces to the Evidence Ledger.
  8. Supervisor review recorded; PR merged; `docs/status.md` updated.

## Work tracking
GitHub Issues (one per unit of work, with owner role label, phase milestone, type label and acceptance criteria), a project board ("rohanjain.pro build": Backlog, Ready, In progress, In review, Done) and one milestone per phase. Progress lives in `docs/status.md` (R-805).

## Branches, commits, PRs
- One issue, one branch `<role>/<issue>-<slug>`, one PR (R-103, R-104). Builders work in isolated worktrees (R-114).
- Conventional Commits with the issue number (R-105) and an `Agent-Role` trailer (R-106). Signed commits on main (R-107). Never bypass hooks (R-116).
- PR title and body format (R-108), size limit (R-109), draft until `npm run verify` passes (R-110).
- Labels from changed paths decide reviewers (R-209).

## Reviews and merging
- Required reviews, format and gate: R-201 to R-208; how to run them: skill `run-review`.
- Only the Supervisor merges, squash only, with branch deletion (R-111). Repo setting: delete head branches automatically.
- GitHub does not let an account approve its own PR, so approvals are review comments plus `approved:<role>` labels, checked by the `review-gate` status check.

## Ceremonies (written, not meetings)
Phase plan, standup log each session and gate record per phase (R-804; skill `phase-gate`). Demos, retrospectives and context audits are retired (ADR-0026).

## Releases and hotfixes
release-please keeps a release PR open; the Supervisor merges it at each phase gate (`v0.N.0`; `v0.9.0` release candidate after Phase 6; `v1.0.0` at launch). Hotfixes use `<role>/<issue>-hotfix-<slug>` with the same checks; roll back first if production is broken.

## How the client sees progress
Project board, PR pages, `docs/status.md`, `docs/standups.md`, and a short terminal summary at the end of each session.

## Versioning
- Semantic Versioning. `v0.x` during local build; `v1.0.0` at production launch.
- `CHANGELOG.md` generated from Conventional Commits (release-please).
- Each release is a Git tag and a GitHub Release with notes and an SBOM.

## Documentation set
`README.md` (written for both recruiters who land on the repo and developers), `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` (code MIT; content and résumé text all rights reserved), `docs/adr/`, `docs/design/`, `docs/security/`, `docs/runbooks/`, `docs/reviews/`, `docs/demos/`, `docs/status.md`, `docs/needs-client.md`, `docs/architecture.md`, `docs/content-guide.md`.
