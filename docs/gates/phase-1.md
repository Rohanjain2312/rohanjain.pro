# Phase 1 gate

Date: 2026-10-17. Criteria from `docs/spec/11-phases.md` (Phase 1) and skill `phase-gate`, with the short-record rules of ADR-0024.

## Phase 1 gate criteria
| Criterion | Result | Evidence |
|---|---|---|
| Green pipeline | Pass | CI green on every `main` commit since PR #135; 11 required checks with no bypass in ruleset 25204664 (PR #135). The last failing Release run predates PR #174 (ADR-0025). |
| Empty styled page builds | Pass | PR #124 (#21); `npm run build` in CI `build` job |
| Headers verified locally | Pass | PR #122 (#18), PR #120 (#17) preview emulation, PR #139 (#29) Playwright headers and inline-code test in CI |
| Content validation passing | Pass | CI `content` job; PR #83 (#22) schemas, PR #119 and PR #137 data, PR #172 restored claims |
| Claims verified by QA | Pass | `docs/qa/claims-verification.md`: 92 claims, 0 mismatch, 1 unsourced (`med-prompts`, logged in `docs/needs-client.md`); PR #152 (#28), PR #172 (#169, #170) |
| Seeded-defect audit 1 scored; roles under 75% retrained | Pass | `docs/qa/audit-1.md` (PR #168): QA 6/6, Security 2/2, Design 1/1; no retraining needed |

## Phase gate steps
| Step | Result | Evidence |
|---|---|---|
| Milestone open issues | Pass with Lows open | Open Lows #91, #111, #156, #159 and the Low backlog #163 do not block a gate (ADR-0024 decision 4); they are done first in Phase 2. Process-tooling Lows moved under ADR-0024 with Security agreement. |
| Review audit (R-206) | Pass with process findings | `docs/qa/review-audit-1.md` (PR #175): 7 of 34 PRs; missing `approved:supervisor` labels on older PRs predate the review-gate check |
| Probe test (R-807) | Pass, part 1 | `docs/qa/probe-results.md` (PR #175): 172 of 172 hook checks; headless part 2 waits for the client's CLI (#75, Phase 8) |
| Security phase review | See PR #176 | `docs/security/reviews/phase-1.md` |
| Demo and retro | Pass | `docs/demos/phase-1.md`, `docs/retros/phase-1.md` (this PR) |
| Context audit | Not required | Runs at Phases 3 and 6 (ADR-0024 decision 7) |
| Agent memory | Pass | PR #114 (#107) |
| `node scripts/phase-gate.mjs 1` | Run at merge | Output recorded in the PR that merges this file |
| Open Medium or higher findings (R-511) | Pass | `gh issue list --state open --label severity:medium` and high, critical: none |
| R-107 signed commits | Run at merge | Command in skill `phase-gate` step 7 |
| Interaction limit (ADR-0018) | Renewed at merge | Skill `phase-gate` step 8 |
| Release `v0.1.0` | At merge | `gh release create v0.1.0 --target main --generate-notes` (ADR-0025) |

## Result
Phase 1 gate passes when PRs #114, #176 and this checkpoint merge and `scripts/phase-gate.mjs 1` prints OK.
