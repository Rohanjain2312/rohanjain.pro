# Security

Threat model, headers, input handling, supply chain, secrets, accounts, DNS, privacy and assessments. Owned by the Security Engineer.

### 8.1 Threat model (STRIDE summary; full version in `docs/security/threat-model.md`)
| Threat | Example | Control |
|---|---|---|
| Spoofing | Email "from" the domain; look-alike domains | SPF `-all`, DMARC `p=reject`, null MX (Phase 7) |
| Tampering | Malicious dependency or GitHub Action alters the build | Pinned versions, lockfile, Actions pinned by commit SHA, Dependabot, CodeQL, OSV scan, rulesets, signed commits |
| Repudiation | Unclear who changed what | Signed commits, PR-only changes, release tags |
| Information disclosure | JD text or secrets committed; `/for` links enumerated | gitleaks pre-commit and CI, push protection, `.gitignore` rules, random slugs, noindex, no JD storage, application data only in a private repo with a private build (ADR-0016) |
| Denial of service | Fit-check ReDoS freezes the tab | Linear-time matcher, input cap |
| Elevation of privilege | Compromised GitHub or Cloudflare account; over-scoped tokens | Passkeys, least-privilege tokens, short expiry |
| XSS / injection | Pasted JD or company name rendered as HTML | Escaped rendering only, banned sinks, strict CSP, Trusted Types where supported |
| Clickjacking | Site framed by a hostile page | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |
| Third-party risk | HF iframe | Click to load, sandbox, single allowed origin; self-hosted fonts |
| Personal data exposure | Phone number scraped by bots | Accepted by the client for reachability. Phone shown as text with a `tel:` link, not in JSON-LD, not in `<meta>` tags, so it is less exposed to bulk scrapers |

### 8.2 HTTP security headers (`public/_headers`, emulated locally in `npm run preview`)
All routes:
- `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://*.hf.space; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; manifest-src 'self'; upgrade-insecure-requests`
  Add the Cloudflare Web Analytics origins in Phase 7 only. No `'unsafe-inline'`, no `'unsafe-eval'`; if Astro inlines anything, use build-time hashes.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Phase 7; submit to the preload list after 30 stable days).
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
`/for/*` and `/print/*`: add `X-Robots-Tag: noindex, nofollow`; `/for/*` also `Cache-Control: no-store`.
Résumé PDFs are indexable (client decision).

### 8.3 Input handling
- All user input stays in the browser, is length-capped, normalized, and rendered as text only.
- No `localStorage` or `sessionStorage` writes of user input.
- Lint bans `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`.

### 8.4 Supply chain
- Minimal dependencies; each new one needs a one-line justification in the PR and Security review.
- `npm ci --ignore-scripts` in CI, then explicit build steps. Lockfile committed.
- `npm audit --audit-level=high` and OSV-Scanner block merge.
- Dependabot weekly, grouped; patch updates auto-merge when all gates pass.
- GitHub Actions pinned to full commit SHA. Workflow `permissions: read-all`; write only per job when needed.
- OpenSSF Scorecard weekly, target 8+.
- CycloneDX SBOM on every release.

### 8.5 Secrets
- The site has no runtime secrets. Until Phase 7 there are no CI secrets at all.
- Phase 7 adds one Cloudflare API token scoped to Pages edit on a single account, stored as a GitHub environment secret with required checks; rotation every 90 days per runbook.
- gitleaks in pre-commit and CI; GitHub secret scanning and push protection enabled.
- Claude Code is denied access to `.env*` and key files (`.claude/settings.json`).

### 8.6 Accounts and access
- GitHub (and Cloudflare at Phase 7): passkeys; recovery codes stored offline by the client. Listed once in `docs/needs-client.md`.
- Domain: Porkbun account with 2FA, transfer lock on, auto-renew on, WHOIS privacy on. Before switching nameservers, DNSSEC at Porkbun must be off; Cloudflare's DNSSEC is enabled after the switch.

### 8.7 DNS and domain hardening (Phase 7)
- DNSSEC enabled; CAA records for the CAs Cloudflare uses.
- No email on the domain: null MX (`0 .`), SPF `v=spf1 -all`, DMARC `v=DMARC1; p=reject; adkim=s; aspf=s`.
- `www` 301 to apex; HTTPS only.

### 8.8 Privacy
- No cookies; cookieless analytics only (Phase 7); no fingerprinting.
- Privacy page states exactly what is collected.
- Work authorization is never stated anywhere. (R-007)
- `security.txt` at `/.well-known/security.txt`.

### 8.9 Security gates and assessments
- Every phase: Security reviews sensitive diffs and records findings in `docs/security/reviews/phase-N.md` with severity.
- Pre-launch assessment (Phase 6, against `npm run preview` with emulated headers): CSP evaluator, local header check, OWASP ZAP baseline scan (Docker, run by Claude Code), dependency and secret scans, XSS payload tests on the fit check, ReDoS test, clickjacking test, `/for` enumeration test, noindex verification.
- Phase 7 repeats the header and ZAP checks against production, plus DNS checks and securityheaders.com / Mozilla Observatory.
- Progress blocks on any open Critical, High or Medium finding. Low findings need an issue and a target date.
