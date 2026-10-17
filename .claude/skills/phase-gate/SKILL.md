---
name: phase-gate
description: Use when starting a phase and when a phase's work is merged. Covers phase planning, the gate record, gate checks and the release.
---

# Phase planning and gates

## Starting phase N
1. Read the phase in `docs/spec/11-phases.md`.
2. Write `docs/phases/phase-N-plan.md`: goal, issues, owners, risks.
3. Create the milestone and one issue per vertical slice, a few per phase (labels: `phase-N`, `role:<role>`, `type:<type>`; acceptance criteria in each), plus one `Phase N Low backlog` issue. Put them on the project board (ADR-0024).
4. Building may start before the previous gate closes once that phase has only findings fixes, audits and gate records left (ADR-0024).

## Closing phase N
- **R-206** Retired (ADR-0026): no review audit.
- **R-804** A phase closes only when its plan and gate records exist (ADR-0026).

Steps:
1. `main` is green. Open Lows do not block (ADR-0024).
2. Write `docs/gates/phase-N.md`: the gate criteria from `docs/spec/11-phases.md`, each with a link to evidence. No demo, retro, review audit, probe test, seeded-defect audit or per-phase Security review (ADR-0026).
3. Run `node scripts/phase-gate.mjs N`. It fails on missing records or open `severity:medium|high|critical` issues (R-511).
4. Check R-107: `gh api "repos/Rohanjain2312/rohanjain.pro/commits?sha=main&per_page=100" --paginate --jq '.[] | select(.commit.verification.verified | not) | .sha'` prints nothing except `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013, ADR-0014).
5. Renew the interaction limit: `gh api -X PUT repos/Rohanjain2312/rohanjain.pro/interaction-limits -f limit=collaborators_only -f expiry=six_months` (ADR-0018).
6. Publish the release: `gh release create v0.N.0 --target main --generate-notes`; the Release workflow attaches the SBOM (ADR-0025).
7. If the gate passes, start the next phase when usage allows (skill `session-protocol`). Never wait for the client.
