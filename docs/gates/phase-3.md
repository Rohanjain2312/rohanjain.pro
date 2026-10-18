# Phase 3 gate

Date: 2026-10-18. Criteria from `docs/spec/11-phases.md` (Phase 3) and skill `phase-gate`. Plan: `docs/phases/phase-3-plan.md`.

## Phase 3 gate criteria
| Criterion | Result | Evidence |
|---|---|---|
| Golden tests and alias audit pass | Pass | PR #201: 56 golden tests (18 synthetic postings, 3 on-site samples, 6 negative controls return "Not a strong fit") and the alias audit (limit 2 of 6 controls, R-406) pass in CI; QA rubric v2 with changelog in `docs/qa/fit-rubric.md`; the independent QA reviewer re-ran the verdicts |
| Property tests pass | Pass | `tests/property/` fast-check properties 1 to 8 at 1,000 cases each (PR #201); property 9 (render test) in `tests/component/` (PR #208) |
| Mutation score at or above threshold | Pass | Clean run (empty cache) `npm run mutation` for `src/lib/fitcheck/`: 97.19 (analyze 100, matcher 96.32, normalize 90, thresholds 100), break 80; reproduced by the independent QA reviewer on 2026-10-18 at `176d0dd`; 8 survivors read and judged equivalent; `docs/runbooks/mutation.md` |
| XSS payload tests pass | Pass | PR #208: 7 payloads in the Frontend tests, 13 more tried by QA (page and brief), all rendered as inert text; no HTML sink, storage or network call in the shipped script |
| Brief prints to one page in Chromium and WebKit | Pass with a limit | PR #208: realistic worst case 802 and 871 px of 919 on one page in Chromium and WebKit; WebKit checked by layout measurement because Playwright cannot print a PDF there; 80 + 80 unbroken wide capitals overflow to 2 pages, logged for a Design Lead ruling (#195) |
| Keyboard-only flow works | Pass | `tests/component/fitcheck.spec.ts` (PR #208), checked by QA including focus return and Escape |
| Fit-rating packet ready in `docs/needs-client.md` | Pass | Optional item added; does not block. The résumé PDF it names does not exist until Phase 4, so the packet uses the home page fold screenshot (`.shots/home-1280-fold.png`) |

## Also checked
| Item | Result | Evidence |
|---|---|---|
| Lighthouse budgets (docs/spec/09-quality.md 9.3) | Pass | 2026-10-18 on `main` at `5f5ac35`: home 100/100/100/100, LCP 1.7 s (budget 1.8 s; was 1.5 s before the fit check), CLS 0, TBT 0; privacy 100/100/100/100, LCP 1.4 s; home page JS about 10.4 KB gzipped (budget 30 KB) |
| axe, headers/CSP | Pass | 127-test frontend suite (zero violations with the section open, a result shown and the brief open) and the 67 headers tests in CI |
| Privacy page matches the code | Pass | QA probe on the built site: 0 requests after load, empty storage and cookies, no pasted text in any request or URL |
| Reader Advocate second rating of the golden set | Pending | Recorded as pending in the rubric; not a gate item; needs a Reader Advocate-readable copy of the fixtures |

## Phase gate steps
| Step | Result | Evidence |
|---|---|---|
| `main` green | Pass | CI and CodeQL on `5f5ac35` (see the release step) |
| Milestone open issues | Pass with Lows open | Lows on #195 (Phase 3 backlog), #190, #163 do not block a gate (ADR-0024 decision 4) |
| Open Medium or higher findings (R-511) | Pass | `gh issue list --state open --label severity:medium` (and high, critical): none |
| R-107 signed commits | Pass | The step 4 command prints only `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013) |
| Interaction limit (ADR-0018) | Pass | Renewed at this gate |
| Agent memory | Pending | Phase 3 memory sweep before the next gate |
| `node scripts/phase-gate.mjs 3` | See PR | Run on this branch before merge |
| Release `v0.3.0` | At merge | `gh release create v0.3.0 --target main --generate-notes` (ADR-0025) |
