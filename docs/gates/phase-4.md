# Phase 4 gate

Date: 2026-10-18. Criteria from `docs/spec/11-phases.md` (Phase 4) and skill `phase-gate`. Plan: `docs/phases/phase-4-plan.md`.

## Phase 4 gate criteria
| Criterion | Result | Evidence |
|---|---|---|
| PDFs pass text extraction | Pass | PR #219: three PDFs of 2 pages each, generated at build into `dist/resume/` by `scripts/resume-pdf.ts`; `scripts/pdf-text.ts` extraction compared with the print route text in `tests/component/resume.spec.ts`; QA checked every string of `resume.json` verbatim in all three PDFs, only the summary differs, no placeholders, no work-authorization line, Letter, single column, no image objects, tagged PDF |
| PDFs pass the claims check | Pass | `check-claims` runs on the extracted PDF text in `npm run build` (PR #219); the one allowlisted number is the client-decided résumé sentence "9.1x" (R-302, 7 page-specific entries in `src/content/claims-allowlist.json`) |
| Generator tested end to end | Pass | PR #218: `tests/unit/applications.test.ts`, 36 tests, including the CLI spawned with a temp `APPLICATIONS_DIR` and a synthetic posting; the output file, stdout and stderr contain no job-description text; the CLI writes nothing under the repo tree; QA hand-mutated the fixes and each failed a test |
| Enumeration and noindex tests pass | Pass | PR #219 `tests/component/for.spec.ts` (11 tests): live and expired results from the real generator in a directory outside the repo; noindex meta and `X-Robots-Tag`, 404 for `/for/`, unknown and near-miss slugs, no sitemap and no link to `/for`, expired page leaks no company, role or verdict, no JD text, axe clean at 390 and 1280 px; QA reproduced with its own results |

## Also delivered
| Item | Result | Evidence |
|---|---|---|
| Random slugs, schema rejects extra fields, expiry (R-502, R-503) | Pass | PR #218 (`src/lib/applications/`); QA re-ran the output-directory exploits (case-folded path, `..x`, symlink, `./.`) and all were refused with nothing written, `.git` included |
| Résumé dialog: three ARIA tabs, no-JS fallback, axe | Pass | PR #219; QA: arrows, Home/End, roving tabindex, Escape, focus return, axe 0 violations on each tab at 390, 768 and 1280 px, JS-off links |
| Private applications repo (ADR-0016) | Pass | PR #217 added rule R-513 (exact-command hook exception; Security: 25 bypass probes failed); repo `Rohanjain2312/rohanjain.pro-applications` created private on 2026-10-18 (`gh api repos/Rohanjain2312/rohanjain.pro-applications --jq .private` prints true) |
| CI installs Chromium before `npm run build` | Pass | PR #219 `ci.yml` build and e2e jobs and `release.yml` sbom job (Security approved) |
| Phase 7 follow-up | Open | Issue #221: `check-claims` on `/for` pages in the production build, and Chromium for the PDFs in the production workflow |

## Phase gate steps
| Step | Result | Evidence |
|---|---|---|
| `main` green | Pass | CI and CodeQL success on `5dbd504` |
| Milestone open issues | Pass with Lows open | Lows on #215 (Phase 4 backlog), #195, #190, #163 do not block a gate (ADR-0024 decision 4); CodeQL alert 26 (test regex) has its fix in issue #224 |
| Open Medium or higher findings (R-511) | Pass | `gh issue list --state open --label severity:medium` (and high, critical): none |
| R-107 signed commits | Pass | The step 4 command prints only `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013) |
| Interaction limit (ADR-0018) | Pass | Renewed 2026-10-18, valid until 2027-04-18 |
| Agent memory | Pass | PR #223 (#222) |
| `node scripts/phase-gate.mjs 4` | See PR | Run on this branch before merge |
| Release `v0.4.0` | At merge | `gh release create v0.4.0 --target main --generate-notes` (ADR-0025) |
