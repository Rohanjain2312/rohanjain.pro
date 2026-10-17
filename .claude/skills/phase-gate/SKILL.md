---
name: phase-gate
description: Use when starting a phase and when all issues in a phase milestone are closed. Covers phase planning, demo, retrospective, gate checks and the release.
---

# Phase planning and gates

## Starting phase N
1. Read the phase in `docs/spec/11-phases.md`.
2. Write `docs/phases/phase-N-plan.md`: goal, issues, owners, risks.
3. Create the milestone and one issue per vertical slice, a few per phase (labels: `phase-N`, `role:<role>`, `type:<type>`; acceptance criteria in each), plus one `Phase N Low backlog` issue. Put them on the project board (ADR-0024).
4. Building may start before the previous gate closes once that phase has only findings fixes, audits and gate records left (ADR-0024).

## Closing phase N
- **R-206** At each gate, QA audits 20% of merged PRs, matching each approval to the reviewer's subagent transcript.
- **R-804** A phase closes only when its plan, demo, retro and gate records exist.

Steps:
1. Milestone has zero open issues; `main` is green.
2. Delegate to QA: the review audit (`docs/qa/review-audit-N.md`), the seeded-defect audit at Phases 1 and 3 (skill `seeded-defect-audit`), and the probe test when `.claude/` changed (skill `probe-test`).
3. Delegate to Security: phase review in `docs/security/reviews/phase-N.md`.
4. Write short records (ADR-0024): `docs/demos/phase-N.md` (what shipped, screenshots), `docs/retros/phase-N.md` (went well, went badly, one process change). Run skill `context-audit` at Phases 3 and 6 only. The review audit runs on haiku; the Security phase review reads the findings register and the phase's security-labeled PRs.
5. Write `docs/gates/phase-N.md`: the gate criteria from `docs/spec/11-phases.md`, each with a link to evidence.
6. Run `node scripts/phase-gate.mjs N`. It fails on missing records or open `severity:medium|high|critical` issues (R-511).
7. Check R-107: `gh api "repos/Rohanjain2312/rohanjain.pro/commits?sha=main&per_page=100" --paginate --jq '.[] | select(.commit.verification.verified | not) | .sha'` prints nothing except `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013, ADR-0014).
8. Renew the interaction limit: `gh api -X PUT repos/Rohanjain2312/rohanjain.pro/interaction-limits -f limit=collaborators_only -f expiry=six_months` (ADR-0018).
9. Merge the release-please PR (tags `v0.N.0`).
10. If the gate passes, start the next phase when usage allows (skill `session-protocol`). Never wait for the client.
