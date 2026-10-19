# Phase 6 gate

Date: 2026-10-19. Criteria from `docs/spec/11-phases.md` (Phase 6) and skill `phase-gate`. Plan: `docs/phases/phase-6-plan.md`.

## Phase 6 gate criteria
| Criterion | Result | Evidence |
|---|---|---|
| Zero open Critical, High or Medium findings | Pass | The Phase 6 assessment (PR #237) rated 232-L6 (#251) Medium; PR #252 fixed it and Security re-probed at the fix head 4cab5af (261 hook checks, 39 probes, fuzz run, no bypass). `gh issue list --state open --label severity:medium` (and high, critical): none. Every Medium found in Phase 6 reviews was fixed before merge (R-305 phone in JSON-LD, plain-word fit-check matches, Cloudflare token scope, missing applications directory, CSP test) |
| Full local security assessment | Pass | PR #237, `docs/security/reviews/phase-6.md`; its Medium 232-L6 was fixed in PR #252 and its Lows in PRs #255, #262 and #263 or logged on #233 |
| Accessibility, performance and SEO budgets met | Not met in some sessions | PR #236 (SEO, accessibility, performance); PR #239 (`npm run lighthouse`, run locally; axe in CI); PR #260 (accessibility Lows). Lighthouse is not a CI job (`docs/handoff.md`). Home LCP sits on the 1.8 s budget line: 1.67 to 1.81 s depending on the session (PR #239 body). The size budgets (spec 9.3) are not asserted. Logged on #233 for Frontend headroom work |
| Cross-browser runs (Chromium, Firefox, WebKit, mobile) | Pass with a gap | PR #239 added the projects. Firefox is no longer a target (ADR-0034, issue #268 closed) |
| Favicon set and OG image | Pass | PR #240 |
| Phase 7 prepared | Pass | PR #254: launch runbook `docs/runbooks/launch.md`, production deploy template, ADR-0032; `docs/handoff.md`; client steps in `docs/needs-client.md`; `status-data` ruleset 25363273 (issue #242) |
| Release candidate tagged | At merge | `gh release create v0.9.0 --target main --generate-notes` (ADR-0025) |

## Also delivered
| Item | Result | Evidence |
|---|---|---|
| Trusted Types CSP and gitleaks config | Pass | PR #255 (Security approved) |
| Fit-check plain-word context (ADR-0030), claims check on `/for` pages (ADR-0031), client values override repo (ADR-0033) | Pass | PRs #250, #254, #257 (ADR-0031, ADR-0032), #261, #263, #264 |
| Low fixes by role | Pass | #244 (PR #261), #246 (PR #260), #247 (PR #262), #248 (PR #263), #249 (PR #264); remaining Lows on #233 |

## Phase gate steps
| Step | Result | Evidence |
|---|---|---|
| `main` green | Pass | CI and CodeQL success on `06a9d19` |
| R-107 signed commits | Pass | The step 4 command prints only `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013) |
| Interaction limit (ADR-0018) | Renew after merge | Last renewed 2026-10-18, valid until 2027-04-18. `gh api -X PUT repos/Rohanjain2312/rohanjain.pro/interaction-limits -f limit=collaborators_only -f expiry=six_months` |
| Agent memory | Pass | Swept in this PR |
| `node scripts/phase-gate.mjs 6` | Pass | `phase 6 gate OK` on this branch (records present, no open Medium+ findings, interaction limit valid) |

## Not done
- Real 5-second and fit-rating results: none received (phase plan); nothing to fold in.
- Reader Advocate rating of the two plain-word golden controls (neg-nurse, neg-lab) was not run; it is a Low, logged on #233.
- Security must review the Phase 7 setup command before the client runs it.
