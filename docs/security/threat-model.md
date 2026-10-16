# Threat model

Owner: security-engineer · Issue: #5 · Date: 2026-10-15 · Status: Phase 0, checked against `main` 989cc69
Expands `docs/spec/08-security.md` §8.1. Sources: `docs/spec/06-architecture.md`, `docs/spec/10-cicd.md`, `docs/rules.md`, `.claude/hooks/`, `.claude/settings.json`, `.claude/skills/`, ADR-0001 to ADR-0014 and ADR-0016 to ADR-0018 (all on `main`), and live repo settings read through `gh api` on 2026-10-15.

Review this file at every phase gate and whenever a trust boundary changes (new workflow, new secret, new third-party origin, new agent tool). Changes need Security review. Check every status against current `origin/main` and live `gh api` settings, not against a PR's base.

## 1. Method

- STRIDE per trust boundary (S spoofing, T tampering, R repudiation, I information disclosure, D denial of service, E elevation of privilege).
- Each row names the mitigation, the rule or check that enforces it, and its status.
- Status key: **active** (works on `main` or in live settings today); **phase-N** (check is built in that phase, `docs/spec/10-cicd.md`); **closed #N (PR #M)** (finding fixed); **open #N (Low)** (finding tracked with a target date); **accepted (ADR-NNNN, RR-N)** (residual risk accepted by ADR and listed in section 8).
- Severity scale: Critical, High, Medium, Low, Info (`docs/spec/08-security.md` §8.9). Medium or higher blocks merge and launch (R-511). PRs that close a finding may still merge under the terms of ADR-0017.
- Hooks in `.claude/hooks/` are tripwires for common and accidental forms, not a boundary (ADR-0018). The input side (interaction limit, fork approval, author rule) and server-side controls (GitHub ruleset, CI, Cloudflare config) are the real boundary. Where a hook is the only control, this file says so.

## 2. Assets

| ID | Asset | Why it matters | Priority |
|---|---|---|---|
| A1 | Site content and claims (`src/content/`, built HTML, résumé PDFs) | A wrong or tampered claim costs interviews and credibility | Integrity: high |
| A2 | Visitor browsers on `rohanjain.pro` | XSS or a hostile script would run under the client's name | Integrity: high |
| A3 | Job description text pasted into the fit check or passed to `npm run for` | Confidential to employers; not the client's to publish | Confidentiality: high |
| A4 | `/for` application data (company, role, verdict, gaps) | Reveals the client's job search and self-assessed gaps | Confidentiality: medium |
| A5 | GitHub account `Rohanjain2312` and its token (scopes `gist, read:org, repo, workflow`) | Shared by all agents; reaches every client repo, including the project repos cited as evidence | All: high |
| A6 | Repo `main`, ruleset `main protection` (id 25204664), review labels and comments | Integrity of what ships and of the review record | Integrity: high |
| A7 | Client machine: home directory, SSH signing key, keychain | Agents run shell commands here | Confidentiality: high |
| A8 | Build and CI pipeline: npm dependencies, GitHub Actions, Playwright | A compromised dependency changes A1 or A2 | Integrity: high |
| A9 | Cloudflare account, Pages project, API token (Phase 7) | Controls what is served on the domain | All: high |
| A10 | Domain `rohanjain.pro` at Porkbun, DNS at Cloudflare (Phase 7) | Takeover means full impersonation | Integrity: high |
| A11 | Client contact details (`site.json`: email, phone) | Spam and scraping | Confidentiality: low (client accepts phone exposure) |
| A12 | Agent instructions and memory (`CLAUDE.md`, `.claude/`, `.claude/agent-memory/`) | Loaded into every future session; a poisoned file persists | Integrity: high |

## 3. Actors

| Actor | Capability |
|---|---|
| Visitor or recruiter | Uses the site; pastes text into the fit check |
| Scraper or crawler | Fetches every public URL; reads the public repo |
| Any GitHub user | Reads the repo. Cannot open issues, comment or open PRs while the interaction limit `collaborators_only` holds (expires 2027-04-16, renewed at each phase gate, ADR-0018). Fork PR workflows need approval for every outside contributor |
| Author of a posting, web page or package | Controls text or code that agents or the build may consume |
| Malicious package or Action maintainer, or one whose account is hijacked | Ships code that runs in installs, builds or CI |
| Account attacker | Phishes or steals GitHub, Cloudflare or Porkbun credentials |
| Agent (honest but wrong, or steered by injected text) | Shell, file and GitHub access as the client |
| Client | Owns all accounts; does only the client-only items in `CLAUDE.md` |

## 4. Trust boundaries and data flows

```
 [Untrusted text]          [Client machine]                               [GitHub]                  [Cloudflare, Phase 7]
 issues, comments,  --B2-> agents + hooks --B1-> shell, files, gh token --B3-> repo, ruleset --B5-> Actions CI --B9-> Pages, DNS
 fork PRs, web pages,        |                                                  ^      ^              |                  |
 postings, reference/        +--> npm install --B4-> npm registry               |      +-- Dependabot +-- release tag --+
                             +--> npm run for (posting file) --B8-> APPLICATIONS_DIR (private repo, private build)     |
                                                                                                                       v
                                                            [Visitor browser] <--B6-- static HTML, PDFs, headers <-----+
                                                              fit check input --B7-> in-page engine (no network)
                                                              "Load live demo" --B6-> *.hf.space iframe
```

| ID | Boundary | Crosses from, to |
|---|---|---|
| B1 | Agents and hooks | Model output to shell, filesystem and GitHub on the client machine |
| B2 | Untrusted content into agent context | Issues, comments, PRs, fetched web pages, `reference/`, postings, agent memory, to the model |
| B3 | Repo and shared GitHub account | Agent sessions to `main`, labels, reviews, settings |
| B4 | Build and supply chain | npm registry, Actions marketplace, Playwright browser download, to local and CI builds |
| B5 | CI | Workflow runs (PRs, forks, schedules, Dependabot) to repo writes and the deploy secret |
| B6 | Static site in the browser | Served files and headers to visitor browsers; third-party iframe |
| B7 | Fit check input | Pasted JD text to the in-page engine and DOM |
| B8 | `/for` pages | Local posting file to generator, result file in the private applications repo, private build, public URL |
| B9 | Cloudflare and domain | Release artifact and token to Pages; Porkbun registrar to Cloudflare DNS |

Data flows:
- DF1 Agent reads an issue or comment, edits files, commits, pushes a branch, opens a PR (B2, B1, B3).
- DF2 `npm ci` or `npm install` pulls packages and runs the build locally and in CI (B4, B5).
- DF3 PR runs CI; Supervisor squash-merges when gates pass; `release.yml` tags; the private repo's workflow deploys to Pages (B3, B5, B9, ADR-0016).
- DF4 `status.yml` fetches demo URLs and public repo dates daily, writes `public/status.json`, opens an automated PR (B5).
- DF5 Visitor loads pages, PDFs and fonts from the same origin; clicks to load a Hugging Face demo (B6).
- DF6 Visitor pastes JD text; the engine scores it in memory and renders text nodes (B7).
- DF7 Client runs `npm run for --jd ./posting.txt`; the result JSON is written to `APPLICATIONS_DIR` in the private repo, the posting is discarded; the private repo builds, deploys and cleans up (B8, ADR-0016).

## 5. STRIDE by boundary

### B1 Agents and hooks

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 1.1 | T | Agent commits or pushes to `main` | Hook deny; ruleset requires PRs, no bypass actors | R-101 guard-bash, ruleset | active |
| 1.2 | T | Force push or delete `main` | Hook deny; ruleset blocks | R-102 guard-bash, ruleset | active |
| 1.3 | T | Agent skips git hooks (`--no-verify`, `HUSKY=0`, `-c core.hooksPath`) | `--no-verify` denied; CI reruns every hook check | R-116 guard-bash; CI | active for `--no-verify`; `HUSKY=0` and `core.hooksPath` open #47 (Low); CI phase-1 |
| 1.4 | E | Role edits paths it does not own | Edit/Write tool deny | R-112 guard-write | active, except `..` in absolute worktree paths open #51 (Low) and shell writes open #47 (Low); CI backstop phase-1 (#14) |
| 1.5 | E | Role merges, approves for another role, or posts a review as another role | Hook deny on `gh pr`, `gh issue`, `gh api`, GraphQL, file and wrapper forms | R-111, R-202, R-203 guard-bash; review-gate CI | active (closed #9 (PR #2), closed #32 (PR #37)); stdin, expansion and wrapper routes and fail-open on hang open #54 (Low); review-gate phase-1 |
| 1.6 | I | Agent reads `.env`, keys or postings | Settings deny for Read; hook deny for listed shell verbs and Read/Grep/Glob | R-509 settings, guard-read, guard-bash | active; interpreters, `git show`, globs and `~/.ssh` open #47 (Low); keychain reads open #63 (Low) |
| 1.7 | E | Agent pipes a download into a shell or deletes outside the repo | Hook deny | R-510 guard-bash | active |
| 1.8 | E | Agent prints the gh token or writes to another client repo | Input-side controls first (2.1); tripwires deny token printing, credential helpers, other-repo writes and remote overrides | guard-bash, ADR-0018 | closed #45, #60, #61 (PR #53); `gh alias`, keychain and clone-dir targeting open #63 (Low); interpreter indirection accepted (ADR-0018, RR-11) |
| 1.9 | T | Agent edits hooks or settings to weaken them, or a hook fails open | `.claude/**` is Supervisor-owned; changes need Security review; probe test after changes; hooks load from the main checkout, so worktree edits take effect only after merge | R-112, R-209 labeler, R-807 | active; `..` paths open #51 (Low); fail-open on hang open #54 (Low); labeler phase-1 (#42) |
| 1.10 | R | Unclear which agent did what | `Agent-Role` trailer, branch prefix, review fields, local hook log | R-103, R-106, R-202 | active; trailer is self-declared (RR-1) |
| 1.11 | D | Runaway agent loops or spawns | Spawn depth 1, `maxTurns` per agent | R-115 settings | active |

### B2 Untrusted content into agent context

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 2.1 | S, E | Prompt injection in a public issue, comment or fork PR steers an agent | Interaction limit `collaborators_only` until 2027-04-16, renewed at each phase gate; fork PR approval `all_external_contributors`; agents act only on content authored by `Rohanjain2312`; review-gate counts only OWNER comments | repo settings (verified 2026-10-15); skills `session-protocol`, `run-review`, `phase-gate`; ADR-0018 | active; closed #45 (PR #53); review-gate phase-1 (#14) |
| 2.2 | S, E | Injection in a posting reaches an agent | Agents never read postings; `npm run for` reads them in a script and outputs only curated skill IDs and CLI-supplied company and role | R-509, R-501, ADR-0007 as amended by ADR-0016 | active; read-guard gaps open #47 (Low) |
| 2.3 | S, E | Injection in a fetched web page (WebFetch: app-data, platform, qa, security) | Fetched text is data, not instructions; Reader Advocate and design roles have no WebFetch; reviews by a separate context | skills `session-protocol`, `run-review`; agent tool lists | active (judgment only) |
| 2.4 | S, T | Hostile text or script in `reference/` (mockups embed a proprietary x-dc runtime) | `reference/` is client-supplied, read-only and treated as data; README says rebuild, do not copy the runtime; CSP blocks third-party script | R-113 guard-write, R-505 headers test | active; headers test phase-1 |
| 2.5 | T | Injected or wrong instruction saved to agent memory persists across sessions | `.claude/**` changes need Security review; memory reviewed in PR diffs | R-209 labeler | phase-1 (#14, #42) |
| 2.6 | T | Text in the client's project repos (READMEs) used as claims | Evidence Ledger and QA verification; client values win | R-301, R-303, R-302 | phase-1 |

### B3 Repo and shared GitHub account

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 3.1 | E | Account takeover of `Rohanjain2312` | Passkey or 2FA, recovery codes offline | `docs/needs-client.md` | client item open |
| 3.2 | S | One account means GitHub cannot tell roles apart; a role can self-approve | Labels plus comments with role, head SHA and agent ID; hook checks; QA review audit | R-201, R-202, R-203, R-206, R-208 | active / phase-1; accepted (RR-2) |
| 3.3 | T | Ruleset edited or disabled through the API | Hook denies non-Supervisor ruleset writes and all deletes | R-111 guard-bash | active; Supervisor or interpreter indirection can still change it (RR-2, RR-11) |
| 3.4 | T, R | Unsigned commits reach `main` | Squash merges are signed by GitHub; signed-commit rule paused; root commit `4d29441` is the one allowed exception | R-107, ADR-0013, ADR-0014, skill `phase-gate` | active (closed #38); rule restore open #33 |
| 3.5 | I | Secrets or JD text committed | `.gitignore`, hook on `git add`, gitleaks, push protection (enabled, verified) | R-501, R-508 | active; gitleaks phase-1 (#12) |
| 3.6 | I | `/for` data and slugs readable in the public repo | See 8.3 | ADR-0016 | closed #44, #62 (PR #55) |
| 3.7 | S | Fake review comment posted by an outside user | Interaction limit stops outside comments; review-gate counts only OWNER-authored comments plus `approved:<role>` labels (outsiders cannot label) | repo settings; R-201 review-gate | active (limit); review-gate phase-1 (#14) |

### B4 Build and supply chain

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 4.1 | T, E | Install script of a dependency runs on the client machine and steals the gh token or SSH key | `.npmrc` `ignore-scripts=true`; explicit, reviewed script steps (`docs/runbooks/dependencies.md`) | `.npmrc` on `main` | closed #46 (PR #52); turning scripts back on (`--ignore-scripts=false`, `npm_config_ignore_scripts`, `npm config set`) open #58 (Low) |
| 4.2 | T | Install script runs in CI | `npm ci --ignore-scripts` | R-507 | phase-1 |
| 4.3 | T | Malicious or vulnerable version | Lockfile, `npm audit --audit-level=high`, OSV-Scanner, minimal deps with justification | R-506, R-507 | phase-1 |
| 4.4 | T | Hijacked patch release auto-merges via Dependabot | Dependabot `cooldown: default-days: 7` for npm and GitHub Actions | `.github/dependabot.yml` on `main` | closed #46 (PR #52) |
| 4.5 | T | Action tag moved to malicious code | Repo setting `sha_pinning_required: true` (verified); pin by full SHA | repo settings; R-504 action-pin check | active (setting); check phase-1 (#15) |
| 4.6 | T | Build-time code (Astro integrations, Playwright) alters output | Built output tested: claims check, headers test, copy lint, html-validate | R-301, R-505, CI | phase-1 |
| 4.7 | T | No record of what shipped | CycloneDX SBOM per release; release tags | §8.4, `release.yml` | phase-1 (#15) |

### B5 CI

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 5.1 | E | Workflow token over-scoped | Default workflow permissions `read`; Actions cannot approve PRs (both verified); write per job only | repo settings; R-504 | active; check phase-1 |
| 5.2 | E, I | Fork PR runs workflows or reaches secrets | Fork PR approval `all_external_contributors` (verified); never `pull_request_target` with PR code; no secret in this repo can read application data | repo settings; ADR-0016; `deploy.yml` review | active; phase-7 |
| 5.3 | T | `status.yml` bot PR bypasses role reviews; fetched data shapes site content | `status.json` holds only booleans and dates computed by the workflow, never response bodies; schema-validated; bot PR still needs all required checks | Security review of `status.yml` | phase-1 or 2 (Info, see 9.4) |
| 5.4 | E | Cloudflare token used by a non-release job | Token held in the private repo's `production` environment (ADR-0016); scoped to Pages edit on one account; 90-day rotation | §8.5, ADR-0016, `docs/runbooks/rotate-secrets.md` | phase-7 |
| 5.5 | I | Secret printed in logs, or application data in public logs and artifacts | No secrets until Phase 7; GitHub masks secrets; gitleaks in CI; this repo's builds use fixtures only | R-508, ADR-0016 | active (no secrets); phase-1 |
| 5.6 | T | Code scanning gaps | CodeQL on PRs and weekly; Scorecard weekly, target 8+ | `codeql.yml`, `scorecard.yml` | phase-1 (#15) |

### B6 Static site in the browser

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 6.1 | T, E | XSS or injected third-party script | Strict CSP (`default-src 'none'`, `script-src 'self'`, no `unsafe-inline` or `unsafe-eval`); add `require-trusted-types-for 'script'` (named in §8.1, missing from the §8.2 header) | R-505 headers test | phase-1 (#18, #29) |
| 6.2 | T | Clickjacking | `frame-ancestors 'none'`, `X-Frame-Options: DENY` | R-505 | phase-1 |
| 6.3 | I | Referrer or cross-origin leaks | `Referrer-Policy`, COOP, CORP, `Permissions-Policy` | R-505 | phase-1 |
| 6.4 | T, E | Hugging Face iframe abuses the page | Created only on click; `sandbox`; `*.hf.space` only in `frame-src`; `referrerpolicy="no-referrer"`; COOP same-origin | R-512 CSP and e2e tests | phase-5 |
| 6.5 | I | Phone scraped | Shown as text and `tel:` link only, never in JSON-LD or meta tags | R-305 | phase-2; accepted by client (RR-5) |
| 6.6 | I | Tracking of visitors | No cookies; cookieless Cloudflare analytics only; privacy page | ADR-0008, R-903 | phase-7 |
| 6.7 | T | Downgrade or SSL stripping | HSTS with preload, `upgrade-insecure-requests` | §8.2 | phase-7 |
| 6.8 | S | Work authorization stated by mistake | Hook and copy lint | R-007 | active; copy lint phase-1 |

### B7 Fit check input

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 7.1 | T, E | Pasted text rendered as HTML (XSS) | Text nodes only; banned sinks | R-405 ESLint, property render test | phase-1 / phase-3 |
| 7.2 | D | ReDoS or oversized input freezes the tab | No regex from user input; precompiled escaped patterns; 8,000-character cap on the posting; 80-character cap on company and role fields | R-402, R-406 | phase-3; field cap dropped from the design spec, open #56 (Low) |
| 7.3 | I | Pasted JD leaves the browser or persists | Engine is pure; no network, no web storage; `connect-src 'self'` | R-401, R-405, CSP | phase-1 / phase-3 |
| 7.4 | T | Inflated verdict misleads a recruiter | Studied tier never counts; thresholds change only with an ADR; golden set | R-403, R-404, ADR-0004 | phase-3 |

### B8 `/for` pages

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 8.1 | I | JD text committed | Posting read and discarded; `postings/` and `*.jd.txt` ignored and blocked; schema rejects extra fields | R-501, R-502, ADR-0007 | active; schema phase-4 |
| 8.2 | I | Pages found through search | `noindex, nofollow` meta and header; out of sitemap; `Cache-Control: no-store` | R-503, §8.2 | phase-4 |
| 8.3 | I | Slugs, companies, verdicts and gaps enumerated from the public repo, its history, or its Actions logs and artifacts | Application data only in the private repo `rohanjain.pro-applications`; `.gitignore`, guard-bash on `add`/`stage`/`mv`, CI tracked-file check; production build, deploy and cleanup run in the private repo; this repo's CI and previews use fixtures only | ADR-0016, R-501; #10, #13, #22 | closed #44, #62 (PR #55); checks phase-1 / phase-4 / phase-7 |
| 8.4 | I | Slug guessed over HTTP | 6 random base32 characters (30 bits) | R-503 | phase-4 |
| 8.5 | I | Expired page stays live | Expiry notice; monthly cleanup in the private repo | §5.5, ADR-0016 | phase-4 |
| 8.6 | I, T | Preview deployments expose unreleased content on `*.pages.dev`; a Pages token in this repo could push a production deploy | Previews build from fixtures only; verify previews send `noindex`; keep the single Cloudflare token in the private repo's `production` environment, or decide previews by ADR | ADR-0016; Phase 7 checks | phase-7 |

### B9 Cloudflare and domain

| # | S/T/R/I/D/E | Threat | Mitigation | Enforced by | Status |
|---|---|---|---|---|---|
| 9.1 | S, E | Cloudflare or Porkbun account takeover | Passkeys or 2FA; Porkbun transfer lock, auto-renew, WHOIS privacy | §8.6, `docs/needs-client.md` | phase-7 |
| 9.2 | S | Email spoofed from the domain | Null MX, SPF `-all`, DMARC `p=reject` strict | §8.7, Phase 7 DNS checks | phase-7 |
| 9.3 | S, T | DNS hijack or mis-issued certificate | DNSSEC (off at Porkbun before the switch, on at Cloudflare after); CAA records | §8.6, §8.7 | phase-7 |
| 9.4 | E | Over-scoped or leaked API token | Pages edit on one account; environment secret in the private repo; 90-day rotation | §8.5, ADR-0016 | phase-7 |
| 9.5 | T | Bad deploy or defacement | Deploy only from release tags; instant rollback; incident runbook | §10.3, `docs/runbooks/incident.md` | phase-7 |
| 9.6 | S | Look-alike domains | None practical; monitor | none | accepted (RR-6) |
| 9.7 | D | Traffic flood | Cloudflare edge, static files, no origin server | ADR-0002, ADR-0003 | phase-7 |

## 6. Agent-specific threats

### 6.1 Prompt injection

Channels, from most to least exposed:
1. Web pages fetched with WebFetch by four roles. Text is attacker-controlled. Mitigated by the "data, not instructions" rule in the skills, role separation and review only.
2. Public GitHub content (issues, comments, fork PRs). The interaction limit `collaborators_only` (until 2027-04-16) blocks outside authors, and agents act only on content by `Rohanjain2312` (ADR-0018). If the limit lapses, the phase gate fails until it is renewed. Closed #45 (PR #53).
3. Job postings. Agents are blocked from reading them (R-509); only the `npm run for` script does, and it emits curated skill IDs plus the company and role the client typed. A posting cannot inject instructions unless an agent reads it through a gap in #47.
4. `reference/`. Client-supplied, read-only and treated as data. The mockups embed a third-party runtime that must not be copied; the CSP and headers test would block it.
5. Agent memory and instruction files. Written by agents, reloaded in later sessions. Changes to `.claude/**` need Security review.

What injection could reach: the shell on the client machine (A7), the gh token for all client repos (A5), and content that ships (A1, A2). ADR-0018 makes the input side the primary control and the hooks tripwires. A steered agent can still reach the token through interpreter indirection; that risk is accepted (RR-11).

### 6.2 Hook bypass

Probe on 2026-10-15: synthetic PreToolUse input fed to `guard-bash.mjs`, `guard-read.mjs` and `guard-write.mjs` copied from `main` 989cc69 (hooks unchanged since e4cc79f), cwd a worktree.

| Command or path (role) | Rule | Result at `main` | Tracked |
|---|---|---|---|
| `git commit --no-verify` (security-engineer) | R-116 | deny (control) | |
| `HUSKY=0 git commit -m ...` (security-engineer) | R-116 | allow | open #47 (Low) |
| `git -c core.hooksPath=/dev/null commit -m ...` (security-engineer) | R-116 | allow | open #47 (Low) |
| `cat .env` (security-engineer) | R-509 | deny (control) | |
| `python3 -c "print(open('.env').read())"` (security-engineer) | R-509 | allow | open #47 (Low) |
| `node -e "...readFileSync('postings/acme.txt')..."` (security-engineer) | R-509 | allow | open #47 (Low) |
| `git show HEAD:postings/acme.txt` (security-engineer) | R-509 | allow | open #47 (Low) |
| `cat .en?` (security-engineer) | R-509 | allow | open #47 (Low) |
| Read `~/.ssh/id_ed25519` (security-engineer) | R-509 | allow | open #47 (Low) |
| `gh auth token` (security-engineer) | R-509 | deny | closed #45, #60 (PR #53) |
| `gh api -X DELETE repos/Rohanjain2312/some-other-repo` (frontend-engineer) | R-509 | deny | closed #45, #61 (PR #53) |
| `gh repo edit Rohanjain2312/some-other-repo --visibility private` (frontend-engineer) | R-111 | deny | closed #45, #61 (PR #53) |
| `git push git@github.com:Rohanjain2312/some-other-repo.git HEAD:feature` (frontend-engineer) | R-509 | deny | closed #45, #61 (PR #53) |
| `security find-generic-password -s gh:github.com -w` (frontend-engineer) | none | allow | open #63 (Low) |
| `npm install left-pad` (frontend-engineer) | none | allow (expected; `.npmrc` turns scripts off) | closed #46 (PR #52) |
| `npm install left-pad --ignore-scripts=false` (frontend-engineer) | none | allow | open #58 (Low) |
| `npm_config_ignore_scripts=false npm ci` (frontend-engineer) | none | allow | open #58 (Low) |
| `npm config set ignore-scripts false` (frontend-engineer) | none | allow | open #58 (Low) |
| Write `<worktree>/docs/security/../../.claude/hooks/owners.json` (security-engineer) | R-112 | allow | open #51 (Low) |
| Write `<worktree>/.claude/hooks/owners.json` (security-engineer) | R-112 | deny (control) | |

Other open hook findings not in the table: stdin, expansion and wrapper routes for reviews and labels, and the hook failing open on a hang (#54, Low); `gh alias` token printing and commands run inside a clone of another repo (#63, Low). Earlier findings: #9 (Medium, closed by PR #2), #32 (Low, closed by PR #37), #60 and #61 (Medium, closed by PR #53 with ADR-0018).

Rating rule (ADR-0018): new bypass forms are Low unless they bypass an input-side control. Exception (#63, 53-I3): a pattern agents hit in normal work, such as passing a gh token to another tool through an environment variable, is rated on its likelihood, not held to Low. Anything that must hold against a steered agent needs an input-side or server-side control.

### 6.3 Shared GitHub account

All seven roles and the Supervisor act as `Rohanjain2312`. Consequences:
- GitHub cannot tell roles apart. Approvals are labels plus formatted comments, checked by review-gate (R-201, R-202, R-208) and audited after the fact (R-206). A steered agent could still forge them through interpreter indirection. Accepted (RR-2, RR-11).
- The account is repo admin. "No bypass" in the ruleset means no bypass actors; an admin token can still edit the ruleset. The hook blocks this for non-Supervisor roles only (3.3).
- The token reaches every client repo. PR #53 adds tripwires for token printing and other-repo writes. The optional repo-scoped token in `docs/needs-client.md` would remove the reach; until the client chooses it, the risk is accepted (ADR-0018, RR-11).
- Outsiders cannot comment while the interaction limit holds, and cannot set labels at all, so labels are the stronger half of an approval. review-gate must count only OWNER-authored comments (3.7).

## 7. Findings register

Findings from this threat model:

| ID | Severity | Finding | Issue | Owner | Status |
|---|---|---|---|---|---|
| TM-1 | Medium | `/for` application files in the public repo expose every application, verdict and gap; random slugs and noindex do not prevent enumeration | #44, #62 | supervisor, app-data, platform | Closed (PR #55, ADR-0016). Result files live only in the private repo `rohanjain.pro-applications`; `.gitignore` (#10), guard-bash (R-501) and a CI tracked-file check (#13) keep them out; production build, logs and artifacts are private. Residual: a person with a `/for` link sees that one page. |
| TM-2 | Medium | Public GitHub content can steer agents; the agents' token reaches all client repos and the hook did not restrict it | #45 (follow-ups #60, #61, Medium) | supervisor | Closed (PR #53, ADR-0018). Interaction limit, fork approval, author rule, hook tripwires. Interpreter indirection accepted (RR-11). Follow-ups #63 (Low, open). |
| TM-3 | Medium | Local npm installs ran install scripts on the client machine; Dependabot patch auto-merge had no cooldown | #46 | platform, supervisor | Closed (PR #52). `.npmrc` `ignore-scripts=true`, 7-day cooldown. Follow-ups #57 (Low, closed), #58 (Low, open). |
| TM-4 | Low | Hook gaps: R-116 via `HUSKY=0` and `core.hooksPath`, R-509 via interpreters, globs, `git show` and home-directory keys, R-112 via shell writes | #47 | supervisor, platform | Open. Target 2026-10-29. |

Related open Low findings from reviews that change row statuses above: #51 (guard-write `..` paths, row 1.4), #54 (hook routes and fail-open, rows 1.5 and 1.9), #56 (fit-check field cap, row 7.2), #58 (install scripts re-enabled, row 4.1), #63 (keychain, `gh alias`, clone-dir targeting, rows 1.6 and 1.8), #42 (labeler security paths, rows 1.9 and 2.5).

No Medium or higher finding from this threat model is open. Medium findings block merge and launch until fixed or accepted by an ADR listed in `docs/needs-client.md` (R-511); fix PRs may merge under ADR-0017.

## 8. Residual risks

| ID | Risk | Why it remains | Owner | Review |
|---|---|---|---|---|
| RR-1 | Attribution rests on self-declared `Agent-Role` trailers and a local, git-ignored hook log | One account; no per-role identity on GitHub | supervisor | each phase gate |
| RR-2 | A steered agent with the shared token can forge approvals or edit the ruleset outside the hooked commands | GitHub cannot tell roles apart; hooks are tripwires (ADR-0018) | supervisor (QA audits via R-206) | each phase gate |
| RR-3 | All reviewers are Claude models and may share blind spots | Model family is fixed; partly offset by model tiers, context separation, machine checks and external validation | supervisor | each phase gate |
| RR-4 | A compromised dependency that passes audit and OSV can still alter the build | No scanner catches every malicious release; cooldown and `ignore-scripts` reduce, not remove, the risk | security-engineer | monthly review |
| RR-5 | Phone number exposed to scrapers | Client decision for reachability; mitigated by keeping it out of structured data | client (accepted), security-engineer monitors | Phase 6 |
| RR-6 | Look-alike domains and phishing in the client's name | Not preventable at reasonable cost | client, security-engineer | Phase 7 |
| RR-7 | Third-party Hugging Face demo content can change at any time | Outside our control; sandboxed, click to load, own origin | frontend-engineer, security-engineer | Phase 5 and 6 |
| RR-8 | Signed-commit rule paused on the ruleset | Waiting on the client's SSH signing key upload; `4d29441` is the one allowed unsigned commit (closed #38) | supervisor | #33 |
| RR-9 | Interaction limit expires 2027-04-16 (six months at most) | GitHub offers no permanent setting for public repos | supervisor | renewed at each phase gate (skill `phase-gate`, ADR-0018); gate fails if lapsed |
| RR-10 | Agents run in the client's user account with network access | Claude Code sandbox mode with a network allowlist not yet evaluated | supervisor | Phase 1 retro (ADR-0018) |
| RR-11 | A steered agent can reach the all-repo gh token through interpreter indirection (`node -e`, `python3 -c`) | A command denylist cannot be complete; accepted by ADR-0018. Mitigation available to the client: the optional repo-scoped fine-grained token in `docs/needs-client.md` (step corrections tracked in #63) | supervisor; client informed via `docs/needs-client.md` | Phase 1 retro (sandbox decision), each phase gate |

## 9. Requirements handed to other issues

These are not findings; they are inputs the owning issue must meet. Security checks them in review.

1. #18 (headers and CSP): add `require-trusted-types-for 'script'` to the CSP, or record why not.
2. #14 (PR process checks): review-gate counts only comments with `author_association` OWNER; pr-hygiene fails PRs that touch paths not owned by the branch's role (#47); labeler routes `.claude/**`, workflows, `.npmrc`, `public/_headers` and dependency files to Security (#42).
3. #15 (security workflows): `sha_pinning_required` is on (verified 2026-10-15); restrict `allowed_actions` (now `all`) to GitHub-owned and selected actions if Scorecard allows.
4. `status.yml`: write only booleans, status codes and dates, never response bodies; validate `status.json` against a schema; the bot PR must pass all required checks (a PR opened with `GITHUB_TOKEN` does not trigger `pull_request` workflows, so use a design that does).
5. Deploy workflows (Phase 7): never run PR code with the Cloudflare token; no `pull_request_target`; the token lives only in the private repo (ADR-0016).
6. Secret scanning for non-provider patterns is off (verified 2026-10-15); turn it on when #12 lands.
