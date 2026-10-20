# Phase 7 gate

Date: 2026-10-19. Criteria from `docs/spec/11-phases.md` (Phase 7) and skill `phase-gate`. Plan: `docs/phases/phase-7-plan.md`.

## Phase 7 gate criteria
| Criterion | Result | Evidence |
|---|---|---|
| Smoke tests green | Pass | Deploy runs 39325108319 (`v0.9.1`), 39334126303 (`v1.0.0`) and 39339567064 (`v1.0.1`) on `Rohanjain2312/rohanjain.pro-applications`: list-expired, remove-expired, build (claims check, output guard) and deploy all succeeded. Live checks with `curl` on 2026-10-19: apex, `www`, `*.pages.dev` and `/privacy/` return 200; the three résumé PDFs return 200; `/for/` returns 404; no `Set-Cookie`; `http://` redirects to HTTPS |
| Headers | Pass, not graded externally | `Strict-Transport-Security`, the strict CSP with the exact Cloudflare beacon URLs, `X-Content-Type-Options` and `Referrer-Policy` are on all hosts (`curl -sI`); PR #286 and the headers e2e spec. securityheaders.com answered 403 to the Supervisor's `curl`, so no external letter grade was obtained |
| Analytics receiving data | Pass | The beacon loads from `static.cloudflareinsights.com/beacon.min.js/<version>` (allowed by the second CSP entry) and `/cdn-cgi/rum` answers 204 (Lighthouse network log, 2026-10-19) |
| Simulated 5-second test passed | Pass | Reader Advocate, Phase 2 gate (`docs/gates/phase-2.md`) |
| Real 5-second test and recruiter ratings | Dropped | Client decision, ADR-0035 |

## Live checks (2026-10-19, Lighthouse mobile, `v1.0.1`)
| Page | Performance | Accessibility | Best practices | SEO | LCP | Console errors |
|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 100 | 100 | 2.09 s | 0 |
| `/privacy/` | 100 | 100 | 100 | 100 | 1.75 s | 0 |

The home LCP is above the 1.8 s budget in `.github/lighthouse-budgets.json` (Google's "good" threshold is 2.5 s). The scores meet their budgets. Logged on #233; Frontend headroom work (the 57 KB `newsreader-roman.woff2`) is a Low.

## Defects found live and fixed
| Defect | Fix |
|---|---|
| Cloudflare Email Address Obfuscation rewrote every `mailto:` and injected a script the CSP blocks | `email_off` markers (PR #297, PR #299); tests walk the built HTML (every `mailto:` inside a balanced pair) |
| Privacy page said "no third-party trackers" | PR #288 |

## Also delivered
| Item | Result | Evidence |
|---|---|---|
| DNS, CAA, null MX, SPF, DMARC, DNSSEC | Pass | Setup run 2026-10-19; the Cloudflare resolver (`dig +dnssec @1.1.1.1`) returns the `ad` flag; DS record at Porkbun |
| Setup token deleted | Pass | Client, 2026-10-19 |
| Deploy token stored as environment secrets, narrow scope | Pass | Setup run; ADR-0032 (amended) |
| Cross-browser matrix | Pass with a note | `npm run test:browsers`: WebKit, iPhone and Pixel pass except one headers test on WebKit and iPhone ("A TLS error caused the secure connection to fail", the WebKit test browser upgrades local HTTP subresources because of `upgrade-insecure-requests`; not a production defect); Firefox is not a target (ADR-0034) |

## Not done
- `/for` fixture page test and rollback test in production (runbook sections 3 and 8): they need client-side commands against the private repo. The first real application is the check; `/for` pages are covered by the local e2e and component tests.
- `www` redirect: not added (ADR-0035).
- HSTS preload submission: after 30 stable days (Phase 8).

## Phase gate steps
| Step | Result | Evidence |
|---|---|---|
| `main` green | Pass | CI and CodeQL success on the `v1.0.1` commit `6d1b588` |
| Open Medium or higher findings (R-511) | Pass | `gh issue list --state open --label severity:medium` (and high, critical): none |
| R-107 signed commits | Pass | The step 4 command prints only `4d2944105bc1cc1e5e540666bdcbd6fb515d2c3d`, the empty root commit (ADR-0013) |
| Interaction limit (ADR-0018) | Pass | Renewed 2026-10-19, valid until 2027-04-19 |
| `node scripts/phase-gate.mjs 7` | Pass | Run on this branch before merge |
| Release | Done | `v1.0.0` and `v1.0.1` (production deploy tag), `gh release list` |
