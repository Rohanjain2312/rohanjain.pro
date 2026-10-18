# Phase 6 Low backlog triage

Issue #235 (split from #230). Triage of every open Low as of `origin/main` 40d79e8 (2026-10-18). QA read each issue body and each comment, then checked the claim against the tree at that commit.

Decisions:

- **Fixed**: already fixed. Evidence cites the file at 40d79e8 or the PR.
- **Fix now**: still valid and cheap. A small fix issue carries the `phase-6` label and an owner.
- **Phase 8**: still valid and larger, or low value before launch. It moves to the Phase 8 milestone with a target and the reason.
- **Closed**: no longer valid. The reason is in the row.

Status: complete. Every line is decided. Fix issues: #243 (Medium), #244 to #249 (one per owner group, milestone Phase 6). Counts are in section 8.

## 1. CodeQL alerts 14 and 15

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| CQ-14 | `js/incomplete-multi-character-sanitization` at `src/lib/claims/check.ts:45` (`<!--` strip) | Fix now | app-data-engineer, #248 | `visibleText` is the only caller path (line 186, number counting). Output is never rendered, so impact is Low (Security, `docs/security/reviews/phase-1.md:82`). Same class as alert 13, dismissed as false positive on 2026-10-17. Security asked for a clean scan at the start of Phase 6. Fix by stripping in a loop until the text stops changing, as `stripHtmlComments` does in `.github/scripts/pr-process.mjs:133`. Fallback if the owner prefers: Security dismisses with the alert 13 reason. |
| CQ-15 | Same rule at `check.ts:51` (`<script` / tag strip) | Fix now | app-data-engineer, #248 | Same evidence and same fix as CQ-14. One issue covers both. |

## 2. Older carried Lows

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| #91-1 | `isoDate` rejects impossible dates (`2000-13-45`, `2000-02-30`) | Fix now | app-data-engineer, #248 | `src/lib/content/schemas.ts:6` is still `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`. |
| #91-2 | Tighten application string and array bounds | Fix now | app-data-engineer, #248 | The `/for` generator shipped in Phase 4 (PR #218), so real sizes exist. Same fix issue as #91-1. |
| #91-3 | `/for` route checks slug and expiry itself | Fixed | PR #219 | `src/pages/for/[slug].astro` rejects a bad slug in `getStaticPaths` and renders the expired notice when `isExpired`. |
| #111-1 | `.gitleaks.toml` with the R-501 job-description rule | Fix now | security-engineer, #245 | `.gitleaks.toml` does not exist at 40d79e8. The Phase 6 assessment runs secret scans, so it belongs here. ADR-0028 defers it from the golden set; it still guards the public repo. |
| #111-2 | commitlint hang on a long unwrapped body line | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | Local-only slowdown on a pathological commit message. No public effect. |
| #111-3 | lint-staged shares the git stash stack | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | Risk is to agent worktrees, not the site. Needs a decision (`--no-stash`) with the autopilot work (#116). |
| #111-4 | R-501 regexes case sensitive; merge, revert and fixup headers skip R-105 and R-106 | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | Confirmed in PR #109 review; hook-only, input-side controls hold (ADR-0018). |
| #111-5 | Document the shared `core.hooksPath` in `docs/runbooks/git-hooks.md` | Fix now | platform-engineer, #247 | One paragraph. Fold into the platform docs fix issue. |
| #126-1 | Glyphs U+2192, U+2197, U+25CF, U+25CB: header lists only ranges the files hold | Fixed | PR #200, d3dba98 | Design Lead gate record accepted the system-font arrows. The remaining text change is `src/styles/fonts.css` header ("accepted, spec 2.4"): Fix now, frontend-engineer. |
| #126-2 | OFL text ships next to the fonts | Fixed | `public/fonts/OFL.txt` | Present at 40d79e8. |
| #126-3 | `base.css` uses family tokens, not its own `--stack-serif` and `--stack-mono` | Fix now | frontend-engineer, #246 | `src/styles/base.css:8-9` still defines both stacks. |
| #126-4 | `assets.test.ts` catches `<style>` in `.astro` | Fixed | `src/styles/assets.test.ts:47` | Test asserts no `<style`. The `<script` and `<style` checks are case sensitive (PR #226 note): Fix now with the `i` flag, frontend-engineer. |
| #127-1 | `checkPins` regex forms (`uses : x@v4`, flow maps, quoted key, next-line value, `docker://`) | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | `sha_pinning_required` is live on the repo and is the real control. CI runs from a fixed workflow set that Security reviews. |
| #127-2 | `PHASE_GATE_TEST=1` re-enables the gate fixtures; print the data source | Fix now | platform-engineer, #247 | Small output change in `scripts/phase-gate.mjs`. The Phase 6 gate runs this script, so a forged run should be visible. |
| #127-3 | Entry guard `import.meta.url === file://${argv[1]}` skips `main` through a symlink | Fix now | platform-engineer, #247 | macOS `/tmp` is a symlink. A silent exit 0 reads as a pass. Same issue as #127-2. |
| #156-1 | Inline-code scan also reads built `*.svg` | Fix now | qa-engineer, #249 | An SVG asset now ships (`dist/_astro/graph-paper.*.svg`, no `<style` or `style=` today). The scan reads HTML only, so a later SVG could carry inline style unseen. Small addition to `tests/e2e/headers-checks.ts`. |
| #156-2 | `javascript:` check decodes HTML entities first | Fix now | qa-engineer, #249 | Small change in `tests/e2e/headers-checks.ts`. The /for and print pages exist now, which also covers #156-3. |
| #156-3 | Re-run headers test against real `/for` and `/print` pages | Fix now | qa-engineer, #249 | Both exist (Phase 4). Platform builds the cross-browser headers suite in #230. |
| #156-4 | CI step "Headers test (R-505)" fails when the test files are missing | Fix now | platform-engineer, #247 | CI file; Security review applies. |
| #159-1 | 135-L1 unclosed `<!--` hides `Closes #N` (CodeQL 11) | Fixed | `.github/scripts/pr-process.mjs:133` | Loop scans from the start after each cut and runs an unterminated comment to the end. |
| #159-2 | 135-L2 `headMatches` accepts a short prefix | Fixed | `pr-process.mjs:331` | Requires 40 hex characters. |
| #159-3 | 135-L4 CHANGES REQUESTED blocks only a required role | Fixed | `pr-process.mjs:403` | `R-201 <role> requested changes at the current head` is in place. |
| #159-4 | 135-L3 (Findings section), 135-L5 (3000 file cap), 135-L6 (labeler path gaps), 135-L7 (log injection), 135-L8 (runbook wording, rerun gate before merge, bootstrap fallbacks) | Fix now | platform-engineer, #247 | Each is a small script or doc edit. 135-L8(a) is a truth-in-docs point that Security flagged. One fix issue, in `.github/scripts`. |
| #153 | npm script re-enable gaps (136-L2) | Phase 8 | supervisor, Phase 8 (post-launch, no date set) | Already moved by ADR-0024. CI installs with `--ignore-scripts` (R-507); `.npmrc` changes show in the PR diff. |
| #128-1 | lychee `--index-files index.html` | Fix now | platform-engineer, #247 | Needed before section links ship; the home page has them. |
| #128-2 | CI steps print their rule ID on failure | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | Convenience only. |
| #128-3 | R-807 check counts uncommitted `.claude/` edits | Closed | n/a | R-807 is retired (ADR-0026). |
| #128-4 | phase-gate skill renews interaction limit; document `--next-gate` | Fix now | supervisor, #244 | Interaction limit expires 2027-04-16; the gate runs in this phase. |
| #123-1 | Skill alias `function calling` on "Tool calling" | Fix now | app-data-engineer, #248 | Alias audit finding from PR #119; PR #201 lists plain-English alias risk (see #195). One alias-hygiene issue. |
| #123-2 | Alias `agent orchestrat` (stem) | Fix now | app-data-engineer, #248 | Same issue. |
| #123-3 | Aliases `anthropic`, `openai` match company names | Fix now | app-data-engineer, #248 | Same issue. |
| #123-4 | Spec notes the longest-match rule | Fix now | supervisor, #244 | No `longest` wording in `docs/spec/06-architecture.md` or `src/lib/fitcheck/` at 40d79e8. App/Data confirms what the matcher does, then the spec states it. |
| #123-5 | Property test for skill count, reference match, verbatim role summaries | Fix now | qa-engineer, #249 | `tests/property/` has the alias audit and engine properties; none asserts the skill count or verbatim role summaries. QA-owned. |
| #121-1 to 6 | Preview server follow-ups (404 for rejected paths, fail without `_headers`, header-name check, symlinks outside `dist/`, runbook, CODEOWNERS) | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | `scripts/preview.mjs` is a local tool; Cloudflare serves production. Exceptions: the CODEOWNERS paths (Fix now, platform-engineer). |
| #116 | Autopilot loop | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | Feature, not a Low. Needs the client's CLI. Already Phase 8. |
| #95 | Lint gate bypasses (85-L1 to L4) | Fix now | platform-engineer, #247 | Security's trigger "must close before any fit-check code merges" was missed: `src/lib/fitcheck/` merged in Phase 3 (PR #201) and `eslint.config.mjs` and `.stylelintrc.mjs` still have no `noInlineConfig` or `ignoreDisables`. Reported to the Supervisor as a process miss; severity stays Low under ADR-0018 because CSP `script-src 'self'` backs the rules. |
| #75 | Probe test part 2 in an authenticated session | Phase 8 | supervisor, Phase 8 (post-launch, no date set) | Cannot run headless without a login (ADR-0024). |
| #72 | Phase 7: Cloudflare token stays in the private repo; tag ruleset | Phase 8 | platform-engineer, Phase 7 launch | Already Phase 7. The tag ruleset is a Phase 7 deploy precondition. |
| #63 | Hook and client-step follow-ups (53-L4, L5, I3, 67-I1, I2, `2>&1` false deny) | Phase 8 | supervisor, Phase 8 (post-launch, no date set) | Already moved by ADR-0024. |
| #54 | guard-bash stdin, wrapper and fail-open routes | Phase 8 | supervisor, Phase 8 (post-launch, no date set) | Already moved by ADR-0024. |
| #47 | Hook gaps (HUSKY=0, interpreters, R-112 via shell) | Phase 8 | supervisor, Phase 8 (post-launch, no date set) | Already Phase 8. |
| #220-1 | `fc-size-ratio` sentence fails R-301 | Fixed | PR #219 | `src/content/claims-allowlist.json` has the 9.1 entries. |
| #220-2 | Move `resume-pdf.ts` to `scripts/` | Fixed | PR #219 | `scripts/resume-pdf.ts` is in the build script. |
| #220-3 | `public/resume/*.pdf` in `.gitignore` | Closed | n/a | The script writes to `dist/resume/` only. |
| #221 | `/for` claims check and Chromium in the production build | Phase 8 | platform-engineer, Phase 7 deploy | Already Phase 7. |
| #203 | Favicon and OG image | Fixed | PR #240 | Issue #203 is closed; the favicon landed on main after the triage base 40d79e8. |

## 3. Phase 1 backlog (#163)

Rows are in comment order. "Fix now" rows carry the issue that holds them.

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| 163-a | PR #135: unpaired code fence before `Closes #N` is still counted | Fix now | platform-engineer, #247 | `pr-process.mjs:153` removes only paired fences (`/```[\s\S]*?```/g`). |
| 163-b | PR #158: ADR-0024 accepted-risk line in `docs/needs-client.md` is broad | Fix now | supervisor, #244 | Line 22 of `docs/needs-client.md` still carries it. |
| 163-c | PR #149: recheck lock ages on or after 2026-10-22 (ADR-0023) | Fix now | security-engineer, #245 | The date is after today (2026-10-18). The Phase 6 assessment (#232) runs after it. |
| 163-d | PR #165: `&copy;` missing from the entity table | Fix now | app-data-engineer, #248 | `ENTITIES` in `src/lib/claims/check.ts` has no `copy`. |
| 163-e | PR #165: per-occurrence match flags the true résumé sentence "9.1x from 437.9 MB" | Fixed | PR #219 | `src/content/claims-allowlist.json` has the 9.1 entries for the pages and PDFs. |
| 163-f | PR #165: check-claims reads `value` and `title` on every tag, skips unquoted attribute values, passes "Served March 2000 customers" | Fix now | app-data-engineer, #248 | `ATTR_TEXT` (`check.ts:34`) is unchanged and quoted-only. |
| 163-g | PR #165: spec rows and evidence ledger still list the old client values; no ADR records the override | Fix now | supervisor, #244 | R-302 is prose in `docs/rules.md:51`. Client values win (R-302); the ADR is the missing record. Not rechecked row by row. |
| 163-h | PR #165: `skills.json` keeps Docker, Kubernetes and similar at tier `shipped` with evidence `["loan"]` only | Fix now | supervisor decides, app-data applies, #244 | `skills.json:1322-1345`. The résumé is client-decided (R-302), so the fix is a recorded ADR, not a data change. Reported in the handback as a truthfulness point. |
| 163-i | PR #165: `source` still says "Résumé, client-confirmed" on four claims | Fix now | app-data-engineer, #248 | `claims.json:6,14,22` and 43 more rows carry the phrase; the four ids named in #163 need the exact wording. |
| 163-j | PR #165: re-date log rows for #140 to #146; fix totals and summary | Fix now | qa-engineer, #249 | `docs/qa/claims-verification.md`; the `fc-f1-cost` row (line 119) also says the display omits "validation", which is stale (PR #187). |
| 163-k | PR #172: `loan-v2-deploy`, `loan-v2-subgraphs` `sourceUrl` point to a repo that does not show Docker, GKE or A2A | Fix now | app-data-engineer, #248 | Only matters if a page renders `sourceUrl` as a citation; check and fix together with 163-i. |
| 163-l | PR #172: claims-log summary cites the content commit, not the PR head | Fix now | qa-engineer, #249 | Same file as 163-j. |
| 163-m | PR #114: QA memory files describe routes around hooks with no scope | Fix now | qa-engineer, #249 | Also #207 memory Lows below. |
| 163-n | Security sweep: `needs-client.md` lacks the ADR-0024 and ADR-0023 lines | Fixed | `docs/needs-client.md:21-22` | Both lines present at 40d79e8. |
| 163-o | PR #182-L1: `globToRegExp` builds `.*` without the `s` flag | Fix now | platform-engineer, #247 | `pr-process.mjs:90` is `new RegExp(`^${re}$`)`. |
| 163-p | PR #182-L2: text that contradicts ADR-0026 | Fixed in part | supervisor, #244 | Fixed: `run-review/SKILL.md:15`, `.claude/rules/ci.md`. Not rechecked: `qa-engineer.md` line 24, `docs/spec/10-cicd.md`, threat-model rows 1.9 and 3.2. |
| 163-q | PR #182-L3: `phase-gate.mjs` says "step 8" | Fixed | `scripts/phase-gate.mjs:95` | Now "step 5". |
| 163-r | PR #182-L4: context audit, needs-client lines 324 and 326, spec 09 line 55, spec 03 line 6, CONTRIBUTING, repo-settings runbook | Fix now | supervisor, #244 | `.claude/skills/context-audit/` still exists; the R-807 step names are gone from `verify.mjs` and `ci.yml` (fixed). |
| 163-s | PR #182-L5: labeler tests miss `guard-bash.mjs` and the empty design and reader lists | Fix now | platform-engineer, #247 | `.github/labeler.json` lists both as `[]`. |
| 163-t | design-lead on PR #164: body mismatch, `<p>` without class | Closed | n/a | PR merged; the home page has been rewritten since. No recurring defect. |
| 163-u | Audit 1: copy lint and headers check skip when an earlier CI step fails; pin check order | Fix now | platform-engineer, #247 | `ci.yml:84-87` still has the "Passing trivially" fallback for check-claims, which now exists; `ci.yml:144-147` headers step says it runs in the e2e job. Order not rechecked. |
| 163-v | Audit 1 D7: no contrast check for the token pairs | Fix now | qa-engineer, #249 | A hand pass found no text below AA (`docs/qa/phase-6-a11y.md` section 1); a committed check keeps it so. |
| 163-w | Audit 1 D8: no lint rule against tautological assertions | Phase 8 | qa-engineer, Phase 8 (post-launch, no date set) | Needs a rule design; no test has been weakened (R-701 held in every review). |
| 163-x | Audit 1: labeler design path gap | Closed | n/a | ADR-0026 retired the design-review label; `labeler.json` lists no paths for it. |
| 163-y | PR #174: stale release-please text; delete the remote branch; `v*` tag ruleset; ADR-0025 date | Fix now | supervisor, #244 | The tag ruleset must precede the Phase 7 deploy (spec 10.3). The `pr-process.mjs` bot exemption goes to platform in #247. |
| 163-z | PR #185 (two rounds): `standups.md`, `status.md` open PRs, plan summary gap, owner line in spec 11 Phase 2, "Seeded-defect audits" line, design spec line 632 | Fixed in part | supervisor, #244 | Closed as stale: standups, open-PRs list, Phase 2 plan and owner line (phase closed, `status.md` is rewritten each issue, R-802). Still present: "Phase 0 retro" in `status.md` (1 match), "Seeded-defect audits" in `needs-client.md:23`, "Reader Advocate reviews" in `docs/design/spec.md:632` (design-lead). |
| 163-aa | PR #189: threat-model DF4 says the status job opens a PR | Fixed | `threat-model.md:76` | Now "no PR (B5)". |
| 163-ab | PR #189: ADR-0016 point 5, spec 11 Phase 7 line, ADR-0026 citation | Fix now | supervisor, #244 | ADR text; not rechecked at head. |
| 163-ac | PR #199 (two rounds): issue #196 wording, status open PRs, plan RA verdict, `#193` property list, plan gate text, §9.5 item 9, merge order | Closed | n/a | Phase 3 closed; plan, status and issue text are superseded. Property 8 now exists (`tests/property/engine.properties.test.ts:285`). |
| 163-ad | PR #202 (five rounds): ADR-0028 and §9.4 wording (heading owner, "live posting", ADR-0016 citation, "near-copy", residual-risk note), spec 11 line 33, `fitcheck.md:15` "belong to QA", RA cannot read the rubric, hand-off channel, gitleaks note | Fix now | supervisor, #244 | `fitcheck.md:15` still says fixtures "belong to QA"; `docs/spec/09-quality.md:3` still says "golden postings". The alias-audit independence point is fixed: QA owns `tests/property/alias-audit.test.ts` (6 negative controls). |
| 163-ae | PR #202: `test-hooks.mjs:145` names `tests/fixtures/postings` | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | A deny probe that stays correct; reviewers marked it optional. |
| 163-af | PR #204 (five rounds): 5-second packet wording (two files, "Pick 5", `browsers:install`, "take it away"), skill `external-validation` order and first-click note, ADR for the fallback, spec criterion 9 and Phase 6 repeat, gate rows, status "Last merged" | Fix now | supervisor, #244 | `docs/needs-client.md` has no `browsers:install`. The packet goes to the client before launch, so these matter now. |
| 163-ag | PR #207: memory Lows (guard wording, one-off recipes, duplicate index lines, long index lines) | Fix now | qa-engineer, #249 | `.claude/agent-memory/qa-engineer/`; QA owns it. |

## 4. Phase 2 backlog (#190)

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| 190-a | PR #186 L1 FinCompress card latency numbers unlabeled | Fix now | frontend-engineer, #246 | Copy edit; recheck against `home.json`. |
| 190-b | PR #186 L2 privacy says "no personal data" with host request logs | Closed | n/a | No "no personal data" text remains in `src/components/copy/`. |
| 190-c | PR #186 L3 privacy copy ("After launch", fit-check line) to reword at Phases 7 and 3 | Phase 8 | frontend-engineer, Phase 7 launch | Tied to launch; analytics line goes with it (PR #187 Security Low). |
| 190-d | PR #186 L4 1440w fallback WebP over the 120 KB figure budget | Fixed | build output | No `.webp` in `dist/` is above 117 KB. |
| 190-e | PR #186 L5 needs-client says 29%, 0.897, 0.888 have no source | Closed | n/a | No such text in `docs/needs-client.md` at 40d79e8. |
| 190-f | PR #186 L6 "twice the human checks" | Fixed | `src/components/copy/home.json:84` | Now "twice the human approvals". |
| 190-g | PR #186 L7 / #126 item 1 glyph acceptance | Fixed | PR #200 record; spec 2.4 | The `fonts.css` header comment is stale: in #246. |
| 190-h | PR #187 Security: CodeQL on `status.test.ts` mocks | Fixed | `src/components/status.test.ts` | Not in the open alert list (open: 14, 15 and Scorecard alerts only). |
| 190-i | PR #187: `status-data` branch outside the main ruleset | Fix now | supervisor, #244 | Before the Phase 7 deploy fetches it. Folds into #231 if Platform prefers. |
| 190-j | PR #187: `status.yml` hardening (refspec, extra keys, size cap, `ls-remote` exit) | Fix now | platform-engineer, #247 | Workflow change: Security review applies. |
| 190-k | PR #187: `direct.href` set without an origin check | Fix now | frontend-engineer, #246 | `src/components/demos.ts` sets `direct.href` from `data-demo-url` unchecked; `isEmbedHost` guards only the embed. |
| 190-l | PR #187: privacy page analytics line at Phase 7; Hugging Face cookies note | Phase 8 | frontend-engineer, Phase 7 launch | Tied to launch. |
| 190-m | PR #187 QA: re-date `fc-f1-cost` row | Fix now | qa-engineer, #249 | Same row as 163-j. |
| 190-n | PR #187 QA: `demo-loaded-*` captures non-deterministic | Phase 8 | frontend-engineer, Phase 8 (post-launch, no date set) | Captures are not compared; no gate effect. |
| 190-o | Design gate Lows: dialog 26 px shorter when demo loads; two-line card title misaligns at 1280; lone figure tile; degree date wraps at 768; footer two rows at 1280 | Phase 8 | frontend-engineer, Phase 8 (post-launch, no date set) | Cosmetic, no accessibility effect, spec allows the lone tile (PR #200 record). |
| 190-p | Footer status fixture dates in the future | Closed | n/a | `public/status.json` does not exist; the date lives only in the test fixture. |
| 190-q | Graph-paper tile moved to `src/assets/`; spec 13.2 test glob | Fix now | frontend-engineer with design-lead, #246 | Spec correct since PR #200; the glob in spec 13.2 still omits the tile (no hex values, so no gap today). |
| 190-r | Committed `footer-status-*.png` come from a fixture and go stale | Phase 8 | frontend-engineer, Phase 8 (post-launch, no date set) | Not compared by any test. |
| 190-s | Playwright configs use fixed ports 4321, 4322 | Fix now | platform-engineer, #247 | Hit three times on 2026-10-18: `npm run verify` failed with `ERR_CONNECTION_REFUSED` on 4322 while another session ran its own suite. |
| 190-t | Favicon and OG image before launch | Fixed | PR #240 | Closed #203; on main after the triage base 40d79e8. |
| 190-u | PR #198: `npm run shots` staleness check ignores config files | Phase 8 | frontend-engineer, Phase 8 (post-launch, no date set) | Developer tool only; rebuild after config changes is documented in `tests/a11y/README.md`. |
| 190-v | PR #198: preview serves `/404.html` with status 200 | Phase 8 | platform-engineer, Phase 8 (post-launch, no date set) | Same family as #121; Cloudflare serves production. |
| 190-w | PR #200 Lows 1 to 9 | Fixed in part | frontend-engineer, #246 | Record naming build 0acfd37, "Not PASS yet" line: Closed (historical record). Open: `fonts.css` header; spec 13.2 glob (190-q); favicon phase named in spec 11 (supervisor, #244). Items 2 to 5 are 190-o. |
| 190-x | PR #206 Lows: GKE and LoRA gloss wording (two rounds), PR-AUC gloss order, built-page gloss check | Fix now | frontend-engineer, #246 | `glosses.test.ts` already checks that each gloss id resolves (re-review), so the silent-drop point is fixed; the built-page check is not. |
| 190-y | Reader Advocate simulated test Lows: third hero number absent on its card; hero says "ML and AI" vs job entry "Data Scientist"; "mentored 3 interns" three times; "real numbers" reads defensive; phone only in contact; 404 joke; figure legibility at 390 | Phase 8 | reader-advocate, Phase 8 (post-launch, no date set) | Judgment calls. The Phase 6 repeat of the 5-second test shows whether any matter; real client results override. The 240 number against New York is a client fact (R-302): Closed. |

## 5. Phase 3 backlog (#195)

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| 195-a | PR #201: three exact-phrase aliases fitted to synthetic postings; ml-01 on the 0.55 edge | Phase 8 | app-data-engineer, Phase 8 (post-launch, no date set) | Needs real fit-rating results (client packet) to tune against. |
| 195-b | PR #201: plain-English skill names read non-tech text as "Strong fit" | Fix now, **Medium** | app-data-engineer, #243 | Reproduced at 40d79e8: a registered-nurse paragraph returns "Strong fit" with 4 proven rows (probe in #243). Raised from Low. |
| 195-c | PR #201: `verdicts.json` says rubricVersion 1 | Fixed | `tests/fixtures/golden/verdicts.json:3` | Now 2, as `docs/qa/fit-rubric.md`. |
| 195-d | PR #201: `mutation.md` says no overrides are needed; cites 82.46 | Fixed in part | `docs/runbooks/mutation.md:41` | The `qs` override is now described. The 82.46 figure was not rechecked; QA reruns the mutation score in #249. |
| 195-e | PR #201: `evidence.json` proof lines "CPU latency 286.9 ms, 19.8 ms", "~7x" lack labels | Fix now | app-data-engineer, #248 | `~7x` still renders on the home card ("~7x XGBoost PR-AUC 0.333"). |
| 195-f | PR #201: zero-width space inside a term hides it from the matcher | Fix now | app-data-engineer, #248 | Normalize before matching. Same issue as 195-b. |
| 195-g | PR #201 round 2: no test for overlapping candidates in `containsTerm` | Fix now | qa-engineer, #249 | One-line test in `tests/property/engine.edges.test.ts`. |
| 195-h | PR #201 round 2: matcher line 15 survivors equivalent for lower-cased input | Closed | n/a | The reviewer judged it equivalent under the documented precondition. |
| 195-i | PR #201 round 2: `engine.edges.test.ts` asserts internal `terms` arrays | Phase 8 | qa-engineer, Phase 8 (post-launch, no date set) | Refactor-fragility only. |
| 195-j | PR #208 (two rounds): worst-case 80 + 80 capitals prints on two pages; spec 7.9 `aria-live`; ordinal "03" via CSS; gap cap 8 and tag cap 6 not in spec 12.2 | Fix now | frontend-engineer with design-lead, #246 | `FitCheck.astro:40` still uses `data-ordinal`. Needs a Design Lead ruling on the title clamp. |
| 195-k | PR #208 round 2: committed index screenshots differ by about 400 pixels | Phase 8 | frontend-engineer, Phase 8 (post-launch, no date set) | Render noise; screenshots not compared. |
| 195-l | PR #210: external-validation skill fallback line; gate row wording; LCP note in Phase 4 plan; "13 more XSS payloads" unrecorded | Fix now | supervisor (#244), frontend-engineer (#246) | Skill and `needs-client.md` wording to supervisor; payload list into `PAYLOADS` in `tests/component/fitcheck.spec.ts` to frontend. The gate row and Phase 4 plan note are Closed (historical; Phase 6 plan tunes LCP). |

## 6. Phase 4 backlog (#215)

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| 215-a | PR #216 (two rounds): plan wording (pipeline of two, PDFs "generated at build", PR C label, status wording, open PRs) | Closed | n/a | Phase 4 shipped (v0.4.0); the plan is a historical record. |
| 215-b | PR #216: spec §11 Phase 4 sample page from a golden posting; hook-exception text in ADR-0026 or threat model | Fix now | supervisor, #244 | Record the R-004 choice or amend the spec; add the hook exception (#214) where Security reads it. |
| 215-c | PR #217 Security: `gh repo new` alias, attached short-flag forms, placeholder form, wrapper class | Phase 8 | security-engineer, Phase 8 (post-launch, no date set) | Same class as #47 and #54 (hooks are guardrails, ADR-0018). |
| 215-d | PR #217: `docs/rules.md` count 86 vs 87 | Fixed | `docs/rules.md:3` | Now 87 and 70. |
| 215-e | PR #217: R-513 status `phase-4`; threat-model line 220 names R-111 first | Fix now | security-engineer, #245 | Table edits; Security owns the table. |
| 215-f | PR #218: no overwrite test, no 365/366 expiry boundary test | Fix now | app-data-engineer, #248 | `flag: 'wx'` is unguarded by tests. |
| 215-g | PR #218: `--jd /dev/zero` passes the size check | Fix now | app-data-engineer, #248 | Check `isFile()` first. |
| 215-h | PR #218: control characters in company and role | Fix now | app-data-engineer, #248 | `/for` renders text (R-405) so the page is safe; reject `\p{C}` at the generator. |
| 215-i | PR #218: `expiry.ts` imports `node:fs` and `index.ts` re-exports it | Fix now | app-data-engineer, #248 | `src/pages/for/[slug].astro` imports `isExpired` from that index. |
| 215-j | PR #218: slug has 30 bits | Closed | n/a | Reviewer accepted it (noindex, expiry, R-503). |
| 215-k | PR #218: e2e repo-tree snapshot skips `.git` | Fix now | qa-engineer, #249 | QA owns `tests/e2e/`. |
| 215-l | PR #219: CodeQL alert 26 (`<SCRIPT>` regex) | Fixed | PR #226 | Alert 26 is in state `fixed`. |
| 215-m | PR #219: "/" allowlist entry for 9.1 masks any 9.1 on the home page | Phase 8 | app-data-engineer, Phase 8 (post-launch, no date set) | Needs a schema `context` field; the number is client-decided (R-302). |
| 215-n | PR #219: `/for` always links the ML Engineer résumé; spec 8.1 says role family | Phase 8 | app-data-engineer, Phase 8 (post-launch, no date set) | Needs a field in the result schema, a contract change with the private repo (ADR-0016). |
| 215-o | PR #219: PDF fonts are Type3; add an embedded-fonts assertion; PES date wraps | Phase 8 | frontend-engineer, Phase 8 (post-launch, no date set) | Text extracts cleanly in pypdf and pdfminer; macOS PDFKit splits words after capitals. |
| 215-p | PR #219 and #227: PDFs go to `dist/resume`; header comment in `scripts/check-claims.ts` line 4 stale; print sitemap test vacuous | Fix now | app-data-engineer, #248 | Comment fix. The sitemap test becomes real when #229 adds `sitemap.xml`. |
| 215-q | PR #223 (two lists): memory file type, name and index lines, `worktree-git-guard.md` content, workaround-style advice | Fix now | qa-engineer, #249 | Other roles' memory files go to their owners through the supervisor. Open question "did the sweep cover every worktree": noted in #244. |
| 215-r | PR #226: `assets.test.ts` case-sensitive `<script` and `<style` checks | Fix now | frontend-engineer, #246 | Lines 38 and 47 lack the `i` flag. |
| 215-s | PR #226: CodeQL alerts 14 and 15 | Fix now | app-data-engineer, #248 | See section 1. |
| 215-t | PR #227: Agent-memory gate row says "Pass" while #223 was open; milestone row on alert 26 | Closed | n/a | #223 merged (no open PR but #97 and #234); alert 26 fixed. Historical gate record. |

#233 (Phase 6) has no lines.

## 7. Fix issues opened

| Issue | Owner | Covers |
| --- | --- | --- |
| #243 | app-data-engineer, severity:medium | 195-b |
| #246 | frontend-engineer | Accessibility A-1 to A-6 and the carried frontend Lows |
| #247 | platform-engineer | Lint-gate bypasses (#95), CI and gate-script Lows |
| #248 | app-data-engineer | CodeQL 14 and 15, schema, claims check, aliases, `/for` generator Lows |
| #249 | qa-engineer | Test, log and memory Lows |
| #244 | supervisor | Spec, ADR, needs-client, status and ruleset text |
| #245 | security-engineer | `.gitleaks.toml`, lock-age recheck, R-513 table edits, Phase 7 inputs |

## 8. Counts

138 rows. A row is one source line or a cluster of lines from one review.

| Decision | Rows |
| --- | --- |
| Fix now | 69 |
| Fixed already | 22 |
| Fixed in part (the open part is Fix now in the same row) | 4 |
| Phase 8 | 31 |
| Closed | 12 |

By section: CodeQL 2 rows (both Fix now); older carried Lows 46; #163 33; #190 25; #195 12; #215 20.

Existing issues changed: #127 and #111 moved to Phase 8 (the fix-now parts carried to #247 and #245); #91, #95, #123, #126, #128, #156 and #159 closed with a pointer to the issue that now holds their open items. #47, #54, #63, #75, #116, #121 and #153 stay in Phase 8; #72 and #221 stay in Phase 7. #163, #190, #195 and #215 stay open as containers until the Supervisor closes them at the gate.

One finding was raised above Low during triage: 195-b, severity:medium, #243. It blocks the Phase 6 gate until fixed. One process miss is recorded in #247 (95: Security's "before fit-check code merges" trigger was missed).

Not rechecked at head (marked in the row): the tail of 163-g, 163-p, 163-ab, 163-ad, and the exact claim ids in 163-i. Rows whose text said "cheap" were not estimated in hours; "Fix now" means each fix is a one-file or one-paragraph change.
