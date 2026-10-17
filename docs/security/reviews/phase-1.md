# Security review: Phase 1

Owner: security-engineer · Issue: #107 · Written 2026-10-17 against `main` 16cd4c7

Scope (ADR-0024 decision 7, skill `phase-gate` step 3): the findings register (`gh issue list --label type:security --state all`, plus every `severity:*` issue) and the Security review comments on Phase 1 PRs (#77 onward; #68 was the last Phase 0 PR). It is not a full-tree review; the full `docs/spec/08-security.md` §8.9 assessment runs at Phase 6. This file replaces the earlier log in draft PR #80, which held only the PR #77 entry (its findings are folded in below).

## Verdict

**Security passes Phase 1. No Medium or higher security finding is open (R-511), so there is no veto.** `gh issue list --state open --label severity:medium`, `severity:high` and `severity:critical` each return nothing.

Conditions the Supervisor should know (none is Medium):
1. `.gitleaks.toml` does not exist on `main` (#111, Low, Security's own item). R-501 names a gitleaks rule for job-description text and it is the only content check for that rule. Security asked in the PR #158 review to keep it in Phase 1. Gate step 1 (empty milestone) needs it closed or moved. Security will land it before the gate record is written, or the gate record lists it as open.
2. #91 (the `isoDate` check, 83-S1) also stays in Phase 1 at Security's request, because `verifiedOn` in `claims.json` is Phase 1 content.
3. The 7-day lock-age check is due on or after 2026-10-22 (ADR-0023, below). It is time-boxed and does not block this gate.
4. `docs/needs-client.md` is missing two accepted-risk lines (see "Accepted risks"). Low, tracked in #163.

## Security reviews of Phase 1 PRs

Built from the REVIEW comments of every PR in scope, one PR at a time. `gh pr view <n> --json headRefOid` equals the head of the last Security review for every merged PR below, and each has `approved:security`.

| PR | Subject | Reviews (heads) | Final | Merged (UTC) |
|---|---|---|---|---|
| #77 | Astro scaffold (#10) | 08c605b APPROVED | APPROVED | 2026-10-16 |
| #81 | verify stamp from worktree (#78) | 0487959 APPROVED | APPROVED | 2026-10-16 |
| #82 | design spec (#19) | 5dc7083 APPROVED | APPROVED | 2026-10-16 |
| #83 | content schemas (#22) | 0fedcc0 APPROVED | APPROVED | 2026-10-16 |
| #85 | lint gates (#11) | f83acfc APPROVED | APPROVED | 2026-10-16 |
| #89 | JSON-LD exemption (#87) | f98f91e APPROVED | APPROVED | 2026-10-16 |
| #94 | memory consolidation (#93) | 9d453a9 APPROVED | APPROVED | 2026-10-16 |
| #106 | Stop hook memory exception (#104) | 8502ed9 CHANGES REQUESTED, 326f982 APPROVED | APPROVED | 2026-10-16 |
| #109 | git hooks (#12) | be10a57 APPROVED | APPROVED | 2026-10-16 |
| #117 | process: sonnet reviewers (#115) | 5b74c84 APPROVED | APPROVED | 2026-10-16 |
| #120 | header emulation in preview (#17) | 18cedca CHANGES REQUESTED, c881c12 APPROVED | APPROVED | 2026-10-16 |
| #125 | CI pipeline, phase gate (#13) | 01d8e07 CHANGES REQUESTED, 90288f2 APPROVED | APPROVED | 2026-10-16 |
| #133 | ADR-0022 parallel agents (#118) | b9f120a CHANGES REQUESTED, ff7d4df APPROVED | APPROVED | 2026-10-17 |
| #134 | security and release workflows (#15) | 6dda56c CHANGES REQUESTED, d79d151 APPROVED | APPROVED | 2026-10-17 |
| #135 | PR process checks (#14) | 3135510 APPROVED, ecb3688 CHANGES REQUESTED, 4079c51 APPROVED | APPROVED | 2026-10-17 |
| #136 | hook path and npm-script tripwires (#51, #58) | 5b8935d, 1fc6ad4, 22c15a3, 2286367 APPROVED | APPROVED | 2026-10-17 |
| #149 | 7-day release cooldown (#79) | f6f003b APPROVED | APPROVED | 2026-10-17 |
| #158 | ADR-0024 ship faster (#157) | 6541e76, f1e8663, 08bdb31 CHANGES REQUESTED, 5ff4688 APPROVED | APPROVED | 2026-10-17 |
| #164 | home page copy refresh (#126), seeded-defect audit | bc03846 CHANGES REQUESTED | closed, not merged | 2026-10-17 |
| #174 | gate-time releases (#173) | 293802a APPROVED | APPROVED | 2026-10-17 |

PR #138 (SECURITY.md, #96) and PR #122 (headers and CSP, #18) are Security's own work; they were not Security-reviewed (R-209) and went through QA. PR #114 (agent-memory sweep, #107) is open: Security APPROVED at 373b360 (comment 6229895769, Low 114-L1 in #163).

PR #164 carried defects seeded for the audit (`seeded-defect-audit`). Security found both blocking ones: #166 (High, CSP `script-src` gained `'unsafe-inline'`) and #167 (Medium, `actions/setup-node` pinned to the mutable tag `v7`). Both issues are closed because the PR was closed unmerged. Current `main` has neither: `public/_headers` has no `'unsafe-inline'`, and `node .github/scripts/ci-checks.mjs pins` prints `pins check OK`.

## Findings

### Medium and higher (all closed)

| Issue | Severity | Finding | Found in | Closed by |
|---|---|---|---|---|
| #150 | Medium | `release.yml` `sbom` job gave a `contents: write` token to `npx` third-party code | PR #134 review | PR #134 (fix at d79d151, token moved to the step that needs it; #150 closed 2026-10-17 00:38) |
| #160 | High | ADR-0024 decision 3 made out-of-scope Medium or higher findings Lows, against R-511 | PR #158 review | PR #158 (fix at f1e8663: "a Medium or higher finding blocks wherever it is found") |
| #161 | Medium | ADR-0024 put haiku on code and hook re-reviews, against ADR-0022 decision 2 | PR #158 review | PR #158 (fix at 5ff4688: haiku only for docs-only fixes) |
| #166 | High | CSP `script-src` gains `'unsafe-inline'` (R-505) | PR #164 review | PR #164 closed unmerged; never on `main` |
| #167 | Medium | `setup-node` unpinned to tag `v7` (R-504) | PR #164 review | PR #164 closed unmerged; never on `main` |

Phase 0 Mediums (#9, #44, #45, #46, #60, #61, #62) are in `docs/security/reviews/phase-0.md`. All 12 Mediums and Highs found so far are closed. Critical: none found.

### Low findings

Lows never block a gate (ADR-0024 decision 4). Closed in Phase 1: #51 (guard-write `..` bypass, PR #136), #58 (no hook on npm script re-enable, PR #136), #56 (80-character cap, design spec), #42 (labeler security paths, PR #135), #148 (136-L1, PR #136), #79 (release cooldown, PR #149).

Open, from `gh issue list --label severity:low --state open` on 2026-10-17 (17 issues):

| Issue | Finding | Target |
|---|---|---|
| #47, #54, #63, #153 | Hook tripwire gaps (HUSKY, interpreters, shell writes, stdin and wrapper routes, npm script flag forms, client-step wording) | Phase 8 (ADR-0024; Security agreed in PR #158) |
| #95 | Lint gates: inline disables, R-401, R-405, R-601 coverage | Phase 3, and closed before any `src/lib/fitcheck/` code merges |
| #91 | Content schema: real date check, tighter application bounds | date check Phase 1; bounds Phase 4 |
| #111 | `.gitleaks.toml` with the R-501 job-description rule; platform Lows from PR #109 | Phase 1 (rule); platform Lows may move |
| #72 | Phase 7: keep the Cloudflare token in the private repo, keep `/for` routes out of deploy logs | Phase 7 |
| #127, #159 | CI and PR-process follow-ups (pin check forms, `PHASE_GATE_TEST`, symlink entry guard; 135-L1 to L8) | Low backlog #163 |
| #162 | Golden set must not commit real posting text (spec 9.4 vs R-501) | needs an ADR before Phase 3 |
| #121, #123, #126, #128, #156 | Preview, skill alias, font, CI and headers-test follow-ups (not Security-owned) | per ADR-0024 moves |
| #163 | Phase 1 Low backlog (checklist) | Phase 1 backlog |

New Lows with no issue of their own, logged on #163 per ADR-0024 decision 4: 114-L1 (memory notes on hook workarounds have no scope); 165-L1 (below); PR #174 stale release-please references, the leftover `release-please--branches--main--components--rohanjain-pro` branch, and the missing `v*` tag ruleset with immutable releases off (add before Phase 7).

165-L1 (Low, this review): CodeQL alerts 14 and 15 are open on `main` (`js/incomplete-multi-character-sanitization`, rated high by CodeQL, created 2026-10-17 04:44 after PR #165 merged) at `src/lib/claims/check.ts:45` and `:51`. The code strips `<script>`/`<style>` blocks and tags to extract visible text from the built pages for the R-301 number check. Its input is the site's own build output and its result is never rendered, so a bypass changes only what the checker sees. This is the same class as 135-L1, which I rated Low. Fix with a loop or a parser (as PR #135 did), or dismiss with this reason. It must be resolved before Phase 6 so the Phase 6 scan starts clean.

### Open code-scanning and OpenSSF Scorecard alerts

`gh api repos/Rohanjain2312/rohanjain.pro/code-scanning/alerts`: 2 CodeQL (above) and 8 Scorecard alerts (BranchProtection, Vulnerabilities, Maintained, CodeReview, SAST, Fuzzing, CIIBestPractices, CITests). The Scorecard ones come from a single-owner, new repository (no second reviewer, short history, no fuzzing, no bestpractices badge). They are informational until Phase 6, where spec §8.4 sets the score target (8 or higher). Secret scanning alerts: 0. Dependabot alerts: 0 open.

## Accepted risks

Only an ADR accepts a risk, and `docs/needs-client.md` must list it (R-511).

| ADR | Risk accepted | Listed in `docs/needs-client.md` | Threat model | Expires or revisit |
|---|---|---|---|---|
| ADR-0018 | A steered agent can reach the all-repo gh token through interpreter indirection; hooks are tripwires, not boundaries | yes: "Optional (accepted risk, ADR-0018)" repo-scoped token step | RR-2, RR-11 | Phase 1 retro (sandbox decision); interaction limit renewed at each gate |
| ADR-0021 | Dev-only `braces` advisory GHSA-vfj7-8cjw-p6xm waived in CI | yes: "Accepted risks" | RR-12 (added by this PR) | 2027-01-15 or when a fix ships |
| ADR-0022 | No opus: Security reviews share a model family with the builders; Lows may be deferred | yes: "Accepted risks" | RR-3 (reworded by this PR) | seeded-defect audits; each gate |
| ADR-0023 | The lock holds packages under 7 days old (54 at the time) | **no** (Low, added to #163) | RR-13 (added by this PR) | clear by 2026-10-22; run the age check on or after that date |
| ADR-0024 | Bounded reviews can miss Lows beyond the stated criteria; docs-only haiku re-checks; context audit at Phases 3 and 6; tripwire gaps open to Phase 8 | partly: the line says "small docs and content fixes", broader than the rule (docs-only), and omits the tripwire gaps (Low, #163) | RR-14 (added by this PR) | each gate; Phase 6 assessment is the backstop |

Closed acceptances: ADR-0014 (signed commits paused) ended with PR #68; RR-8 is closed.

## Live checks at 2026-10-17

| Check | Result |
|---|---|
| Interaction limit (`interaction-limits`) | `collaborators_only`, expires 2027-04-16 (renewed 2026-10-16; the gate script passes this check) |
| Actions permissions | `sha_pinning_required: true`; `default_workflow_permissions: read`; `can_approve_pull_request_reviews: false` |
| Fork PR approval | `all_external_contributors` |
| Ruleset 25204664 | `active`; rules: deletion, non_fast_forward, required_linear_history, pull_request, required_signatures, required_status_checks |
| R-107 | the unsigned-commit query prints only the root commit `4d29441` (ADR-0013, ADR-0014) |
| Token scopes (`gh auth status`) | gist, project, read:org, repo, workflow; no `write:ssh_signing_key` |
| R-504 pins | `node .github/scripts/ci-checks.mjs pins`: `pins check OK` |
| CSP and headers | `public/_headers`: CSP with `script-src 'self'`, `style-src 'self'`, no `'unsafe-inline'`, no hashes; `/for/*` and `/print/*` carry `X-Robots-Tag`; `/for/*` is `no-store` |
| `node scripts/phase-gate.mjs 1` | no severity failure; fails only on the Phase 1 records (demo, retro, gate, review audit) and the probe test (R-807, `.claude/` changed after the last probe) |

## Folded from draft PR #80 (PR #77 review, head 08c605b)

PR #77 was APPROVED. Checks: exact pins and R-506 justifications; lockfile registry sources and sha512; clean `npm ci` with `ignore-scripts=true`; `npm audit` 0; `npm audit signatures`; OSV batch over 354 versions with 0 hits; preview bound to `[::1]:4321`.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 77-L1 | Low | 52 of 354 locked packages were under 7 days old; the cooldown covered only Dependabot | closed (#79, PR #149; residual time-boxed by ADR-0023) |
| 77-I1 | Info | Astro telemetry on by default (sends a hash of the public git remote); suggest `ASTRO_TELEMETRY_DISABLED=1` | open |
| 77-I2 | Info | `verify.mjs` stamp location made R-110 deny `gh pr ready` from worktrees | closed (PR #81) |
| 77-I3 | Info | `docs/runbooks/dependencies.md` says `npx playwright install chromium` without `--no-install` | open |
| 77-I4 | Info | TypeScript 6.0.3 also fits the `@astrojs/check` peer range; `@types/node` 26 is newer than the Node 24 runtime | open |
| 77-I5 | Info | `src/content/applications/.gitkeep` missing and no `owners.json` entry for the path | open |

## Escaped defects

Defects Security missed in a review and that someone found later. Each has a memory entry in `.claude/agent-memory/security-engineer/`.

| Defect | Missed in | Found by |
|---|---|---|
| `npm config --location=project set ignore-scripts false` (a flag between `config` and `set`) was not in the first PR #136 finding (136-L1) | PR #136 review at 5b8935d | QA, round 1 of the same PR; Security confirmed the family in the next reviews (136-L2, #153) |
| First PR #136 review read the new tripwires as the named routes only; four more review rounds found flag, continuation and exemption forms | PR #136 | QA rounds 2 to 5 |

Earlier Phase 0 entries (CODEOWNERS mapping read by eye in PR #36; `..` path in PR #2) are in `docs/security/reviews/phase-0.md`.

## Carried to later phases

- Phase 3: #95 before any fit-check code; #162 needs an ADR before `tests/fixtures/postings/` exists.
- Phase 6: full §8.9 assessment; resolve CodeQL alerts 14 and 15; Scorecard alerts; renew the interaction limit before 2027-04-16.
- Phase 7: #72; `v*` tag ruleset and immutable releases (deploys use release tags, spec §10.3); HSTS and analytics origins in `public/_headers`.
