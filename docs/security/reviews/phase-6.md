# Security review: Phase 6 local assessment

Owner: security-engineer · Issue: #232 · Started 2026-10-18 against `origin/main` 40d79e8 · Status: **in progress**, groups are added as they finish

Scope: `docs/spec/08-security.md` 8.9, run against a local build of `origin/main` (`npm ci --ignore-scripts`, `npm run build`, `node scripts/preview.mjs --port 47213`, which applies the headers of `public/_headers` through `dist/_headers`). Earlier reviews (`phase-0.md`, `phase-1.md`) hold the closed items; they are not repeated here.

Build facts: `dist/` holds `/`, `/privacy/`, `/404.html`, `/print/resume/{ai,ml,ds}/`, `/resume/*.pdf` (3), `_astro/*`, `fonts/*`. There are no `/for/*` pages (the collection is empty without `APPLICATIONS_DIR`), no `robots.txt`, no `sitemap` (SEO is #229). Ports 4321, 4322 and 4399 were in use by other agents' servers on this machine, so every test here used port 47213, 47214 or 127.0.0.1 explicitly.

## Findings

| ID | Severity | Finding | Issue | Owner | Status |
|---|---|---|---|---|---|
| 232-L1 | Low | CSP has no `require-trusted-types-for 'script'`. Threat model 6.1 and section 9 item 1 said "add it or record why not"; neither happened. No DOM sink exists in `src/` (grep, below), so this is defence in depth | to open | security-engineer | open |
| 232-I1 | Info | CSP evaluator: one finding, `script-src 'self'` may allow JSONP or user-uploaded scripts. Not applicable: the site hosts no JSONP endpoint, no upload and no Angular | none | none | accepted as is |
| 232-I2 | Info | `npm audit` (all): 9 high, all one advisory (GHSA-vfj7-8cjw-p6xm, `braces` 3.0.3, dev only). Waived by ADR-0021 until 2027-01-15; no fixed `braces` exists (latest is 3.0.3). `npm audit --omit=dev`: 0 | none | none | RR-12 |
| 232-I3 | Info | `scripts/preview.mjs` serves `/_headers` as a file (200). Cloudflare Pages does not. Emulator only; the file is public in the repo | none | none | no action |
| 232-I4 | Info | `tests/component/brief-print.spec.ts` hard-codes `localhost:4322`, so its two layout tests fail when the suite runs on another port. Not a security issue; QA/Frontend follow-up | none | qa-engineer | note for #230 |

No Critical, High or Medium finding so far.

## Checks run

### 1. CSP evaluator and header check

- Tool: Google `csp_evaluator` 1.1.8 (the library behind csp-evaluator.withgoogle.com), installed with `npm install --ignore-scripts` into a scratch directory outside the repo (published 2026-05-26, older than the 7-day rule). The online page needs a browser; the library gives the same checks.
- Command: `node eval.mjs public/_headers` (parses the `Content-Security-Policy` line and runs `CspEvaluator.evaluate()`).
- Result: policy `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://*.hf.space; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; manifest-src 'self'; upgrade-insecure-requests`. One finding, severity 50 (possible, "MEDIUM_MAYBE"): `'self' can be problematic if you host JSONP, AngularJS or user uploaded files` (232-I1). No `unsafe-inline`, no `unsafe-eval`, no wildcard script source, `object-src` covered by `default-src 'none'`, `base-uri` set.
- Not covered by the library: Trusted Types (232-L1).
- Header check by `curl -sI http://127.0.0.1:47213<path>`, route classes seen so far:

| Route | Status | CSP + 6 base headers | `X-Robots-Tag` | `Cache-Control` |
|---|---|---|---|---|
| `/` | 200 | yes | none (correct) | none |
| `/privacy/` | 200 | yes | none | none |
| `/404`, `/404.html`, unknown path | 404 (`/404.html` direct: 200) | yes | none | none |
| `/print/resume/ml/` | 200 | yes | `noindex, nofollow` | none |
| `/resume/Rohan-Jain-ML-Engineer.pdf` | 200, `application/pdf` | yes | none (indexable by client decision) | none |
| `/for/x` (no such page) | 404 | yes | `noindex, nofollow` | `no-store` |
| `/_astro/Base.*.css` | 200 | yes | none | none |
| `/fonts/*.woff2` | 200 | yes | none | none |

The full per-route matrix, `/for`, `/print` without slash and encoded-path forms are in group 7 below (pending).

### 3. Dependency scan (partial)

- `npm audit` (all): 9 high, one advisory, `braces` (232-I2). `npm audit --omit=dev`: `found 0 vulnerabilities`. `npm view braces versions`: newest is 3.0.3.
- OSV, gitleaks, secret regex scan: pending.

### 4. XSS tests on the fit check and the brief

- Committed tests: `npx playwright test` with a scratch config on port 47214 over `tests/component/{fitcheck,brief-print,for,demo}.spec.ts`: 51 passed, 2 failed. The two failures (`brief-print.spec.ts:140` and `:144`, worst-case brief layout, Chromium and WebKit) connect to a hard-coded `localhost:4322` that I did not run (232-I4). The seven committed XSS payload tests and property test 9 passed. Running these tests rewrote three tracked screenshots under `tests/visual/screenshots/`; I reverted them (`git checkout`).
- Source check: `grep -E "innerHTML|outerHTML|insertAdjacent|document.write|eval\(|new Function|set:html|is:raw|location\.|URLSearchParams|postMessage|localStorage|sessionStorage|document.cookie|fetch\(|XMLHttpRequest|WebSocket" src` (tests excluded): no match. The visitor input has no source other than the three fields.
- My own payloads: 11 payload sets (posting, company and role each carrying a payload), Playwright script against `http://127.0.0.1:47213/` in Chromium, each run through the check and then the brief. Checked per set: `window.__xss` never set, no `dialog`, no request outside the origin, no element of the injected kinds inside `[data-fit]` or `[data-brief]`, no `on*` attribute anywhere, no `javascript:` URL, the set of `id` values and `document.forms` unchanged (DOM clobbering), `document.cookie`, `querySelector`, `body`, `location`, `getElementById` types unchanged, brief title has no child elements.

| # | Payload class | Result |
|---|---|---|
| 1 | DOM clobbering: `<form id="document" name="body"><input name="cookie" id="location">`, `<img name="querySelector" id="__xss">` | pass |
| 2 | mXSS: `<svg></p><style><a id="</style><img src=1 onerror=...>">` | pass |
| 3 | mXSS: `<noscript><p title="</noscript><img src=x onerror=...>">`, `<!--><img ...>-->` | pass |
| 4 | `javascript:` URLs, mixed case, tab and newline split, entity-encoded | pass |
| 5 | `data:text/html` and `data:image/svg+xml` URLs | pass |
| 6 | Unicode normalization: fullwidth `＜script＞` (NFKC to `<script>`) | pass |
| 7 | Ligatures, Kelvin sign, dotless and dotted i, U+FDFA, fullwidth `javascript:` | pass |
| 8 | Bidi override, NUL, lone surrogates, zero-width characters | pass |
| 9 | Template and prototype names: `{{7*7}}`, `${...}`, `{company}`, `$&`, `$1`, `__proto__`, `constructor` | pass |
| 10 | CSS and attribute breaks, `<link>`, `<base>`, `<meta refresh>`, `onfocus` in an attribute-style value | pass |
| 11 | `srcdoc` iframe, `object`, `embed`, `formaction` | pass |

  Also: a 2.3 MB paste leaves 8,000 characters in the textarea (fill and run 361 ms); a 1 MB company value is cut to 80.
- Result: ALL PASS. No finding. Not tested: the `/for` page and the print routes with attacker-controlled fields (group 7).

### 5. ReDoS and complexity test on the engine

- Method: `src/lib/fitcheck/` run in Node 24 with the real `skills.json` (300 skills), 46 extras and 497 distinct terms. The matcher uses `indexOf` and boundary checks, no regex on visitor text (R-402). `normalizeText` uses one `\s+` regex, which is linear.
- Inputs of 8,000 characters: 16 generic adversarial texts (single character, whitespace of every kind, U+FDFA and other NFKC and lowercase expanders, surrogate pairs, lone surrogates, non-ASCII neighbours of terms, short-term boundary bait for `r`, `c++`, `c#`, all terms joined by spaces and by `x`), plus 2,982 per-term cases (each of the 497 terms repeated with a space, glued, with `x` after or before it, as a prefix chain and as an overlap).
- Result: generic worst case 13.4 ms (all terms glued). Per-term worst median over 9 runs: 28 ms. Single-run maxima up to 0.45 s occurred on different terms each run, and are scheduler and GC noise on a busy machine (other agents' servers and builds were running); they do not repeat. Scaling: 8,000 characters 1.2 ms, 80,000 characters 1.7 ms, 800,000 characters 3.6 ms. The cap holds and time does not grow with input beyond it. NFKC expansion of 8,000 U+FDFA stays at 8,000 characters after the second cut.
- Result: no ReDoS or quadratic path. No finding.

## Pending

Groups 2 (ZAP or manual probes), 3 (OSV, secrets), 6 (clickjacking), 7 (`/for` fixture, noindex, full header matrix), 8 (PDF metadata), 9 (agent memory and hooks, earlier Lows), 10 (supply chain), and the threat-model update. This file is updated after each group.
