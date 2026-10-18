# Phase 2 gate

Date: 2026-10-18. Criteria from `docs/spec/11-phases.md` (Phases 2 and 5, merged by ADR-0026) and skill `phase-gate`. Plan: `docs/phases/phase-2-plan.md`.

## Phase 2 gate criteria
| Criterion | Result | Evidence |
|---|---|---|
| Design review passes the anti-slop checklist at 390/768/1280 px | Pass | `docs/design/phase-2-gate-review.md` (PR #200): pages and footer pass; two Mediums in the demo dialog (unstyled button, invisible focus ring) fixed in PR #187 (`d3dba98`), QA checked the focus screenshots; Lows on #190 |
| Reader Advocate simulated 5-second test passes | Pass | `docs/reader/phase-2-simulated-5-second-test.md`: PASS on the hero; Medium 1 and 2 fixed in PR #187, Medium 3 (jargon) fixed in PR #206 (#205) and re-checked by QA |
| Zero axe violations | Pass | `tests/a11y/` (`npm run test:frontend`): home, privacy and 404 at 390 and 1280 px, folds closed and open; runs in `verify` and the CI `e2e` job (PR #187); QA ran 15 repeats with no flake |
| Lighthouse budgets met locally | Pass | `tests/a11y/README.md`, run 2026-10-18 on `main` at `210ae48`: home 100/100/100/100, LCP 1.5 s, CLS 0; privacy 100/100/100/100, LCP 1.4 s; 404 SEO 60 by design (`noindex`) |
| Claims check and copy lint green | Pass | CI `build` and `static` on every merged PR; `check-claims: OK (3 page(s))`; 7 new claims verified in `docs/qa/claims-verification.md` (QA) |
| Real 5-second test packet ready in `docs/needs-client.md` | Pass | Optional item added; does not block |

## Phase 5 gate criteria (folded in)
| Criterion | Result | Evidence |
|---|---|---|
| CSP still passes with embeds | Pass | 67 headers tests in CI `e2e` (`frame-src https://*.hf.space`); demo spec: no iframe before the click, sandboxed iframe only for `https://*.hf.space` (PR #187); Security approved at `0acfd37` and `4bb5ff4` |
| Images within budget | Pass | Largest figure image ships at 50,238 bytes (budget 120 KB); fold shots and Lighthouse above |
| Status workflow runs successfully via manual dispatch | Pass | Run 39099773533 (2026-10-18): `collect` and `publish` succeeded, branch `status-data` created with `status.json` (ADR-0027) |

## Phase gate steps
| Step | Result | Evidence |
|---|---|---|
| `main` green | Pass | CI and CodeQL success on `210ae48` |
| Milestone open issues | Pass with Lows open | Lows on #190 (Phase 2 backlog), #163; they do not block a gate (ADR-0024 decision 4) |
| Open Medium or higher findings (R-511) | Pass | `gh issue list --state open --label severity:medium` (and high, critical): none |
| R-107 signed commits | Pass | The step 4 command prints only `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013) |
| Interaction limit (ADR-0018) | Pass | Renewed at this gate: `collaborators_only` until 2027-04-18 |
| Agent memory | Pending | Phase 2 memory sweep #179 before the next gate |
| `node scripts/phase-gate.mjs 2` | See PR | Run on this branch before merge |
| Release `v0.2.0` | At merge | `gh release create v0.2.0 --target main --generate-notes` (ADR-0025) |
