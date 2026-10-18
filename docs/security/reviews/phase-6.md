# Security review: Phase 6 local assessment

Owner: security-engineer · Issue: #232 · PR: #237 · Run 2026-10-18 against `origin/main` 40d79e8 (main moved to 5974732 during the run; the only change was after the build and touched no file this review depends on)

Scope: `docs/spec/08-security.md` 8.9, run against a local build (`npm ci --ignore-scripts`, `npm run build`, `node scripts/preview.mjs`, which applies the headers of `public/_headers` through `dist/_headers`). Earlier reviews (`phase-0.md`, `phase-1.md`) hold the closed items and are not repeated.

## Verdict

**No Critical, High or Medium finding. Security passes the Phase 6 local assessment (R-511: nothing blocks).** Six Lows (two with their own issues, four on the Phase 6 Low backlog #233), eight Info items. Four checks were not run; see "Not run".

## Findings

| ID | Severity | Finding | Tracked in | Owner | Target |
|---|---|---|---|---|---|
| 232-L1 | Low | CSP has no `require-trusted-types-for 'script'`; threat model 6.1 and section 9 item 1 said add it or record why not. No DOM sink exists in `src/`, so defence in depth only | #241 | security-engineer | 2026-10-30 |
| 232-L2 | Low | Branch `status-data` is unprotected (`protected=false`; ruleset 25204664 targets only the default branch). Tampered `status.json` can show a false date, up/down state or text in the footer, not script | #242 (ruleset recommendation inside) | supervisor | before Phase 7 (2026-11-06) |
| 232-L3 | Low | `/.well-known/security.txt` (spec 8.8) does not exist; `public/` holds only `_headers` and `fonts/`; the route returns 404 | #233 | platform-engineer | 2026-10-30 |
| 232-L4 | Low | CodeQL alerts 14 and 15 (`js/incomplete-multi-character-sanitization`, `src/lib/claims/check.ts`) still open; 165-L1 asked to clear them before Phase 6. Input is the site's own build output | #233 | supervisor | 2026-10-30 |
| 232-L5 | Low | `.gitleaks.toml` still missing; CI gitleaks uses default rules, R-501 has no content rule (ADR-0028 made it non-blocking) | #111, #233 | security-engineer | Phase 7 prep |
| 232-L6 | Low | guard-bash tripwire gaps re-confirmed (below): attached short flags in the `gh api` parser, absolute path to `gh` or `git`, wrapper class. Fix the cheap structural ones before Phase 7 | #215, #54, #47, #233 | supervisor | before Phase 7 |
| 232-I1 | Info | CSP evaluator: `script-src 'self'` may allow JSONP or uploaded scripts. Not applicable (no JSONP, no upload, no Angular) | none | none | none |
| 232-I2 | Info | `npm audit` (all): 9 high, one advisory (GHSA-vfj7-8cjw-p6xm, `braces` 3.0.3, dev only); waived by ADR-0021 to 2027-01-15; no fixed `braces` exists. `--omit=dev`: 0. OSV finds the same one | RR-12 | none | 2027-01-15 |
| 232-I3 | Info | The emulator (`scripts/preview.mjs`) differs from Cloudflare Pages: serves `/_headers` (200); answers POST, PUT, DELETE, TRACE with the page (200); sends no security headers on 404s for rejected paths (`%2f`, `%00`, bad `%` escapes, `..%2f`). Emulator only | none | none | re-test on production in Phase 7 |
| 232-I4 | Info | `tests/component/brief-print.spec.ts` hard-codes `localhost:4322` (two layout tests fail on another port). Not security | none | qa-engineer | note for #230 |
| 232-I5 | Info | No `robots.txt` or sitemap yet (SEO is #229). When added: sitemap must not list `/for/*` or `/print/*` (R-503) | #229 | frontend-engineer | Phase 6 PR A |
| 232-I6 | Info | Git author email `rohanjain2312@gmail.com` appears on 80 commits (GitHub web squash commits). It is the public contact address on the site; no other personal email exists in tree or history | none | none | none |
| 232-I7 | Info | Playwright browsers download from the Playwright CDN with no pinned hash (`npm run browsers:install`; also in `release.yml`, read-only token). Same class as RR-4 | RR-4 | none | monthly review |
| 232-I8 | Info | Settings: `strict_required_status_checks_policy: false` (branches need not be up to date); Actions `allowed_actions: all` (pins are enforced instead); `required_approving_review_count: 0` (single owner, Scorecard alerts CodeReview and BranchProtection) | none | none | none |

## Checks run

### 1. CSP evaluator and local header check

- Tool: Google `csp_evaluator` 1.1.8 (the library behind csp-evaluator.withgoogle.com), installed with `npm install --ignore-scripts` in a scratch directory outside the repo (published 2026-05-26). Command: `CspEvaluator(new CspParser(policy).csp).evaluate()` on the `Content-Security-Policy` line of `public/_headers`.
- Result: one finding, severity 50 (possible): `'self' can be problematic if you host JSONP, AngularJS or user uploaded files` (232-I1). No `unsafe-inline`, `unsafe-eval`, wildcard script source or hash; `default-src 'none'` covers `object-src`; `base-uri`, `form-action` and `frame-ancestors` are `'none'`. The library has no Trusted Types check (232-L1).
- Header matrix: raw `http.request` probes to `http://127.0.0.1:47213` (no URL normalisation by a client). The seven base headers (CSP, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP) were present on every response for a path the server accepts.

| Route class | Status | Base headers | `X-Robots-Tag` | `Cache-Control` |
|---|---|---|---|---|
| `/`, `/index.html` | 200 | all 7 | none | none |
| `/privacy`, `/privacy/` | 200 | all 7 | none | none |
| `/404`, `/404.html`, unknown path | 200 / 404 | all 7 | none | none |
| `/print/resume/{ai,ml,ds}/` and without slash | 200 | all 7 | `noindex, nofollow` | none |
| `/print`, `/print/`, `/print/resume/zz/` | 404 | all 7 | `noindex, nofollow` | none |
| `/resume/*.pdf` (3) | 200 `application/pdf` | all 7 | none (indexable, client decision) | none |
| `/for`, `/for/`, `/for/x`, `/%66or/x`, `/for/./x` | 404 | all 7 | `noindex, nofollow` | `no-store` |
| `/_astro/*.css`, `/fonts/*.woff2` | 200 | all 7 | none | none |
| `/FOR/x`, `//for/x`, `/PRINT/resume/ml/` | 404 | all 7 | none (these paths are not served here) | none |
| `/for%2fx`, `/print%2fresume%2fml/`, `/..%2fpackage.json`, `/%00`, `/%PR` | 404 | **none** (emulator rejects the path before matching; 232-I3) | none | none |

- Directory listing: `/_astro/`, `/fonts/`, `/resume/` return the 404 page. Secrets and traversal: `/.git/config`, `/.env`, `/package.json`, `/../package.json`, `/%2e%2e/package.json` all 404. No `Server`, `X-Powered-By`, `Set-Cookie` or CORS header on any response. A request with `Origin: https://evil.example` and `X-Forwarded-Host` gets no `Access-Control-Allow-Origin`.
- Methods on the emulator: HEAD returns headers only; OPTIONS, POST, PUT, DELETE, PATCH and TRACE return the page with 200 and no echo of the request; CONNECT and a 100 KB path are reset by Node. Cloudflare's behaviour is not testable locally (232-I3).

### 2. OWASP ZAP baseline and manual replacement

- **Not run: ZAP.** `docker --version` reports 29.8.1, but the daemon is not running (`failed to connect to the docker API at unix:///var/run/docker.sock`). I did not start Docker Desktop or pull the 1.5 GB image on the client's machine, and installed nothing.
- Replacement: the raw HTTP probes above (missing headers, cookies, information leakage, directory listing, method handling, traversal, CORS/Host headers) and the cookie and mixed-content checks below. These cover the passive ZAP rules; they do not replace its active rules or spider. Repeat with ZAP in Phase 7 against production (spec 8.9).
- Cookies: no `Set-Cookie` on any route; `document.cookie` is empty in the browser tests. Mixed content: the page loads with `upgrade-insecure-requests`; the only third-party origin is the click-loaded `*.hf.space` iframe. No request left the origin in any browser run.

### 3. Dependency and secret scans

- `npm audit` (all): 9 high, one advisory, `braces` 3.0.3 (232-I2). `npm audit --omit=dev`: `found 0 vulnerabilities`. `npm audit signatures`: verified registry signatures, 297 packages with attestations.
- OSV: `osv-scanner` is not installed. **Replaced** by a batch query to `https://api.osv.dev/v1/querybatch` over all 913 packages of `package-lock.json`: 1 hit, `braces` 3.0.3 / GHSA-vfj7-8cjw-p6xm (waived, ADR-0021, `.github/osv-scanner.toml`). CI `ci.yml` (OSV-Scanner action) succeeded on main at 40d79e8 and 5974732.
- gitleaks: **not installed**; no `.gitleaks.toml` (232-L5). **Replaced** by a regex scan of the 447 tracked text files at HEAD and every added line of all commits on all refs (4.6 MB of diff). Rules: AWS keys, GitHub tokens (classic and fine-grained), Slack, OpenAI, Anthropic, Hugging Face, Google API keys, Cloudflare-style tokens, private key headers, JWTs, generic `key/secret/token/password = value`, emails, phone numbers and job-description phrases ("responsibilities", "qualifications", "about the role", "equal opportunity employer"). Result: 0 credential hits, 0 job-description hits. Emails and phone numbers found are the client's own contact details (`site.json`, specs, tests, accepted RR-5), `noreply@` addresses, `fake@example.com` and test strings. The gitleaks Action in CI runs on every PR with default rules.
- GitHub side: secret scanning enabled, push protection enabled, secret scanning alerts 0; non-provider patterns and validity checks are disabled (threat model section 9 item 6 asked to enable the first when #12 landed; it is still off, Info). Dependabot alerts: 1, `auto_dismissed` (the same `braces` advisory).

### 4. XSS tests on the fit check and the brief

- Source check: no `innerHTML`, `outerHTML`, `insertAdjacent`, `document.write`, `eval`, `new Function`, `set:html`, `is:raw`, `location`, `URLSearchParams`, `postMessage`, `localStorage`, `sessionStorage`, `document.cookie`, `fetch`, `XMLHttpRequest` or `WebSocket` in `src/` (tests excluded). Visitor input comes only from the three fields; no URL or storage source.
- Committed tests: `playwright test` with a scratch config on port 47214 over `tests/component/{fitcheck,brief-print,for,demo}.spec.ts`: 51 passed, 2 failed (232-I4, a hard-coded port, not a security test). The seven committed payload tests and property test 9 passed. The run rewrote three tracked screenshots; reverted with `git checkout`.
- Own payloads: 11 sets (posting, company and role each carry the payload), Playwright in Chromium against the preview server, check then brief. Per set: `window.__xss` unset, no `dialog`, no request outside the origin, no injected element or `on*` attribute, no `javascript:` URL, set of `id` values and `document.forms` unchanged, `document.cookie`, `querySelector`, `body`, `location`, `getElementById` types unchanged, brief title has no child element.

| # | Payload class | Result |
|---|---|---|
| 1 | DOM clobbering: `<form id="document" name="body">`, `<input name="cookie" id="location">`, `<img name="querySelector" id="__xss">` | pass |
| 2 | mXSS: `<svg></p><style><a id="</style><img src=1 onerror=...>">`, `<math><mtext><table><mglyph><style><!--</style>...` | pass |
| 3 | mXSS: `<noscript><p title="</noscript><img ...>">`, `<!--><img ...>-->` | pass |
| 4 | `javascript:` URLs: mixed case, tab and newline split, entity-encoded | pass |
| 5 | `data:text/html` (plain and base64) and `data:image/svg+xml` URLs | pass |
| 6 | Unicode normalization: fullwidth `＜script＞` and `＜img onerror＞` (NFKC makes `<script>`) | pass |
| 7 | Ligatures, Kelvin sign, dotted and dotless i, U+FDFA, fullwidth `javascript:` | pass |
| 8 | Bidi override, NUL, lone surrogates, zero-width characters | pass |
| 9 | Template and prototype names: `{{7*7}}`, `${...}`, `{company}`, `$&`, `$1`, `__proto__`, `constructor` | pass |
| 10 | CSS and attribute breaks: `<link>`, `<base>`, `<meta refresh>`, `onfocus` style value | pass |
| 11 | `srcdoc` iframe, `object`, `embed`, `formaction` | pass |

  A 2.3 MB paste leaves 8,000 characters in the textarea (fill and run: 361 ms); a 1 MB company value is cut to 80. Result: ALL PASS, no finding.
- `/for` page with hostile fields: see check 7.

### 5. ReDoS and complexity test on the engine

- The matcher uses `indexOf` and boundary checks; no regex is built from visitor text (R-402); `normalizeText` uses one linear `\s+` replace.
- Real `skills.json` (300 skills), 46 extras, 497 distinct terms. 16 generic adversarial 8,000-character texts (single character, every kind of whitespace, NFKC and lowercase expanders U+FDFA, U+3392 and U+0130, surrogate pairs and lone surrogates, non-ASCII neighbours, boundary bait for `r`, `c++`, `c#`, all terms joined by spaces and by `x`) plus 2,982 per-term cases (each term repeated spaced, glued, with `x` after or before, prefix chain, overlap).
- Result: generic worst 13.4 ms; per-term worst median over 9 runs 28 ms. Single-run maxima up to 0.45 s hit different terms on each run and did not repeat (other agents' builds were running). Scaling: 8,000 characters 1.2 ms, 80,000 1.7 ms, 800,000 3.6 ms, so the cap holds. NFKC expansion of 8,000 U+FDFA ends at 8,000 characters. No finding.

### 6. Clickjacking

- A framing page on a different origin (`127.0.0.1:47216`) embedded `/`, a `/for/<slug>` page, `/print/resume/ml/`, a PDF, an `<object>` and an `<embed>` of the site (Chromium).
- Result: `/`, `/for/<slug>` and `/print/resume/ml/` iframes ended at `chrome-error://chromewebdata/`; the console logged `Framing '...' violates the following Content Security Policy directive: "frame-ancestors 'none'"` five times; `<object>` and `<embed>` produced no frame. The PDF iframe stayed blank (headless Chromium has no PDF viewer; PDFs are public by design). COOP: a popup opened from the framer has `window.opener === null` and the framer cannot read its document (`SecurityError`). `X-Frame-Options: DENY` is present on every route (header matrix). No finding.

### 7. `/for` enumeration, noindex and XSS on `/for`

- Fixture: synthetic posting in the scratchpad (outside the repo), `node scripts/for.ts --out <scratch>/apps` for two applications (one with company `<img src=x onerror=...>"` and role `<svg onload=...>`), `APPLICATIONS_DIR=<scratch>/apps astro build --outDir <scratch>/dist-for`, preview on port 47215.
- Guessing: `/for/acme-nidbfi` (valid) 200. Wrong last character, truncated suffix, bare `acme`, upper case, `.html` suffix, `/for`, `/for/`, `/for/index.html`: all 404. The 30-bit suffix is not guessable by hand; online guessing is rate-limited only by Cloudflare (Phase 7).
- Listing and leakage: no index page; no `/for` link on any other page (`grep /for/` in the built HTML finds only the two `/for` pages themselves); no sitemap or robots file; the posting marker string is not in the build output; the result JSON holds no posting text (`grep` of the files).
- Headers: every `/for/<slug>` form (`/`, `/index.html`, `%66or`, `/for/./`) carries `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store`; the page has `<meta name="robots" content="noindex, nofollow">`. `/print/resume/*` has the header and the meta tag.
- Not served here but to re-test in Phase 7 on Cloudflare: `//for/<slug>`, `/FOR/<slug>`, `/for/<slug>.html`, because `_headers` path matching is Cloudflare's, not ours.
- XSS: the hostile page rendered the company and role as text (`&lt;img ...&gt;` in `<title>` and body; `mailto:` subject is `encodeURIComponent`-encoded); in Chromium `window.__xss` unset, no `on*` attribute, no injected element, no inline script, no CSP violation. No finding.

### 8. PDF metadata and content

- Parser: Node script (no `exiftool`, `pdftotext` or `qpdf` installed) that reads the Info dictionary, looks for an XMP packet, inflates all 133 Flate streams per file and searches all text.
- Result (three files, 121 KB each): Title `Rohan Jain, <role>`, Creator `Chromium`, Producer `Skia/PDF m156`, creation date 2026-10-18; no Author, Subject or Keywords; no XMP; no absolute path, `localhost`, IP, `file:` or `blob:` URL, username or host name; no JavaScript, Launch, EmbeddedFile, OpenAction or form action. Link annotations are the 8 public profile and project URLs only. Fonts are subsetted IBM Plex Mono and Newsreader. Text is glyph-encoded, so email and phone cannot be searched in the content; both are on the résumé by client decision (RR-5). No finding.

### 9. Agent memory and hooks

- Memory: 77 files (design-lead 5, qa-engineer 47, security-engineer 25; the other roles have none). Scanned by script for bypass and workaround wording, hook-disable forms, permission overrides, token and keychain handling, interpreter shell-outs, remote-exec installs, self-approval advice and secret or posting reads. No file advises bypassing a rule or reading a secret. The "bypass" hits are review records of gaps found in PRs #85, #109, #136, #137 (for example `qa-engineer/project-npm-script-bypass-pr136.md`, `security-engineer/hook_review_checklist.md`): they list how tripwires can be defeated. In a public repo that is documentation of known, accepted gaps (ADR-0018), not advice, but they have no scope note (114-L1 in #163, already tracked). Indexes: every `MEMORY.md` link resolves (design-lead 4, qa 48, security 26). No credential or personal data in memory files (secret scan above covers them).
- Hooks: `guard-read.mjs` and `guard-write.mjs` read; probes of `guard-bash.mjs` below used synthetic PreToolUse JSON (role `security-engineer`, cwd this worktree) fed to the hook file on `origin/main` 40d79e8. Nothing was executed.

| Class | Forms probed | Result |
|---|---|---|
| Controls | `gh api -X POST` to another repo, `gh pr merge`, `gh api -X DELETE`, GraphQL `mutation`, `gh pr comment ... REVIEW:`, token printing, issue transfer | all denied |
| Attached short flags in the `gh api` parser | `-ftitle=x`, `-Ftitle=x`, `-f=title=x`, `-X=POST`, `-X=PUT` on `pulls/1/merge`, `-flabels[]=approved:qa`, `-f=labels[]=...`, `-X=DELETE` on a ruleset, `gh api user/repos -fname=x` | **all 9 allowed** (the parser ignores them, so the call looks like a read) |
| Absolute path | `/opt/homebrew/bin/gh` with `pr merge`, `api -X DELETE`, `repo delete`, `repo edit --visibility private`, forged `pr comment REVIEW:` | **all 5 allowed** (the gh section tests `t[0] === 'gh'`); `auth token` and `issue transfer` still denied by the raw-text rules |
| Wrapper class | `timeout`, `nice`, `( ... )`, `{ ...; }`, `env -u FOO`, `echo $(...)`, `if ...; then ...; fi`, `find -exec`; for git: `timeout`, `/usr/bin/git`, `(git push --force ...)` | **all allowed**; `env -i`, `command`, `bash -lc`, `x=1 gh`, `\gh` and `xargs` are denied |
| Legit use | `gh pr view`, `gh api` read, `gh issue create --label severity:low`, supervisor `gh pr merge` | allowed (no false positive) |

  Rating (ADR-0018): Low. The hooks are tripwires; the ruleset, the 11 required checks (including `review-gate`), the interaction limit (`collaborators_only`, expires 2027-04-18) and fork approval (`all_external_contributors`) are the boundary, and RR-11 already accepts interpreter indirection. **Which to fix before launch:** all three classes are reachable by a plain mistake, not only by a steered agent, and each fix is small. Do them in one PR before Phase 7 (232-L6): match `basename` of the command for `gh` and `git`; add `timeout`, `nice`, `sudo`, `stdbuf` and `env` option arguments to the wrapper list; start a segment after `(`, `{`, `$(`, `then`, `do`, `else`; parse `-fk=v`, `-Fk=v`, `-f=k=v`, `-X=V`. The remaining items in #47, #54, #63 and #153 can stay in Phase 8 (ADR-0024).
- Live GitHub settings read at the end of the run: interaction limit `collaborators_only` expires 2027-04-18; `sha_pinning_required: true`; default workflow permissions `read`, Actions cannot approve PRs; fork PR approval `all_external_contributors`; ruleset 25204664 active with no bypass actors (deletion, non_fast_forward, linear history, pull_request, required_signatures, required_status_checks); token scopes gist, project, read:org, repo, workflow.

### 10. Supply chain

- Pins: `node .github/scripts/ci-checks.mjs pins` prints `pins check OK`. All `uses:` lines in the 9 workflows carry a full SHA with the version in a comment.
- Permissions: every workflow sets `permissions: read-all`; write is per job and only where needed: `labeler` (`pull-requests: write`), `codeql` and `scorecard` (`security-events: write`; scorecard also `id-token: write`), `release.attach-sbom` and `status.publish` (`contents: write`). `release.sbom` and `status.collect` are read-only; `sbom` runs third-party code (`npx --yes @cyclonedx/cyclonedx-npm@6.0.1`) with `persist-credentials: false` and a read token (closes #150). `status.publish` runs no repo code beyond inline `node -e` shape validation, then `git push origin status-data`.
- Triggers and injection: no `pull_request_target`, `workflow_run` or `issue_comment` anywhere; PR title, body and branch names are not expanded into `run:` blocks; the labeler, pr-hygiene, branch-name and review-gate scripts come from the PR base commit. `release.yml` passes the tag through `env`, never inline.
- Dependabot: npm and github-actions, weekly, `cooldown: 7`, grouped minor and patch, majors of TypeScript and ESLint ignored; no auto-merge. Dependabot security updates enabled.
- status-data gap: 232-L2 (#242). Recommendation: a `status-data protection` branch ruleset blocking deletion and non-fast-forward, without signatures or PR rules; the Supervisor decides.
- Playwright download surface: 232-I7. Release workflow: `release: published` and `workflow_dispatch` only; needs write access to trigger; SBOM attached by `gh release upload` with `--clobber`.
- Code scanning: CodeQL alerts 14 and 15 (232-L4) and 8 Scorecard alerts (BranchProtection, Vulnerabilities, Maintained, CodeReview, SAST, Fuzzing, CIIBestPractices, CITests). The Scorecard ones come from a single-owner, new repository; the Vulnerabilities one is the `braces` advisory.

## Not run

| Check | Why | What replaced it |
|---|---|---|
| OWASP ZAP baseline scan | Docker daemon not running; no sudo or installs allowed | raw HTTP probes (check 2); run ZAP in Phase 7 against production |
| `osv-scanner` binary | not installed | OSV batch API query over the lockfile; CI OSV job green |
| `gitleaks` binary | not installed, no `.gitleaks.toml` | documented regex scan of tree and history |
| `exiftool` | not installed | Node PDF parser |
| Online csp-evaluator.withgoogle.com | needs a browser session | the same library, `csp_evaluator` 1.1.8 |
| Cloudflare behaviour of `_headers`, methods, `//for`, case | needs production | Phase 7 header and ZAP re-check |
| Firefox and WebKit XSS runs | Chromium only | committed suites run WebKit for layout only; add to #230 if wanted |

## Escaped defects

None found by someone else in this review. Process notes: the scratchpad directory is shared by all agents in a session, so a config file I wrote there was overwritten by another agent's; I moved my files to a private subdirectory. Ports 4321, 4322 and 4399 were held by other agents' servers; every test used explicit 127.0.0.1 and ports 47213 to 47216.

## Carried forward

- Phase 7: ZAP and header checks on production (spec 8.9); re-test `//for`, case variants and methods on Cloudflare; HSTS and analytics origins; `v*` tag ruleset; #72.
- Before launch: #241, #242, 232-L3 to L6 as in the table. Renew the interaction limit before 2027-04-18.
