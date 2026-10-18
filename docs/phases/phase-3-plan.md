# Phase 3 plan: Fit check and brief

**Goal:** a visitor pastes a job posting and gets an honest, deterministic verdict with evidence rows and gaps, plus a one-page printable brief. Meets the Phase 3 gate in `docs/spec/11-phases.md`. ADR-0026: two PRs, one combined review each.

## PRs
| PR | Issue | Owners | Scope |
|---|---|---|---|
| A | #193 | App/Data (engine), QA (rubric, golden verdicts, property and mutation tests, alias audit) | `analyze()` per `docs/spec/06-architecture.md` §5.4 with config, alias table and `Report` type; golden postings in `tests/fixtures/postings/`; ReDoS test; fast-check properties; Stryker config |
| B | #194 | Frontend (UI), Design Lead (brief layout) | Section 03 "Check fit": samples, textarea, optional fields, verdict, evidence rows, gaps, brief with print stylesheet; XSS payload tests; keyboard-only flow; one-page print in Chromium and WebKit |

Out of scope: résumé dialog, PDFs and `/for` pages (Phase 4).

## Order
1. App/Data pushes the `Report` type and `analyze` signature first (small commit on the PR A branch). Frontend builds against it with fixture reports while the engine is finished.
2. Golden-set separation (`docs/spec/09-quality.md` §9.4): App/Data writes paraphrased requirement lists only; QA writes `docs/qa/fit-rubric.md` and the expected verdicts; App/Data never edits `tests/fixtures/` verdicts.
3. PR B builds while PR A is in review (pipeline of two). Alias audit and threshold changes (ADR only) follow §9.4.
4. Gate record `docs/gates/phase-3.md`, `node scripts/phase-gate.mjs 3`, release `v0.3.0`.

## Risks
- Aliases too broad: QA alias audit against the negative controls (§9.4 item 6).
- Real postings: store only paraphrased requirements, never verbatim text (R-501, issue #162 covers the spec wording).
- The fit-rating packet for the client (`docs/needs-client.md`) does not block the gate.
- Mutation score below threshold blocks the gate: QA owns the Stryker run.
