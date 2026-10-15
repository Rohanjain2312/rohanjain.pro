---
name: phase-gate
description: Use when starting a phase and when all issues in a phase milestone are closed. Covers phase planning, demo, retrospective, gate checks and the release.
---

# Phase planning and gates

## Starting phase N
1. Read the phase in `docs/spec/11-phases.md`.
2. Write `docs/phases/phase-N-plan.md`: goal, issues, owners, risks.
3. Create the milestone and one issue per unit of work (labels: `phase-N`, `role:<role>`, `type:<type>`; acceptance criteria in each). Put them on the project board.

## Closing phase N
- **R-206** At each gate, QA audits 20% of merged PRs, matching each approval to the reviewer's subagent transcript.
- **R-804** A phase closes only when its plan, demo, retro and gate records exist.

Steps:
1. Milestone has zero open issues; `main` is green.
2. Delegate to QA: the review audit (`docs/qa/review-audit-N.md`), the seeded-defect audit at Phases 1 and 3 (skill `seeded-defect-audit`), and the probe test when `.claude/` changed (skill `probe-test`).
3. Delegate to Security: phase review in `docs/security/reviews/phase-N.md`.
4. Write `docs/demos/phase-N.md` (screenshots, what changed), `docs/retros/phase-N.md` (went well, went badly, one process change), and run skill `context-audit`.
5. Write `docs/gates/phase-N.md`: the gate criteria from `docs/spec/11-phases.md`, each with a link to evidence.
6. Run `node scripts/phase-gate.mjs N`. It fails on missing records or open `severity:medium|high|critical` issues (R-511).
7. Merge the release-please PR (tags `v0.N.0`).
8. If the gate passes, start the next phase when usage allows (skill `session-protocol`). Never wait for the client.
