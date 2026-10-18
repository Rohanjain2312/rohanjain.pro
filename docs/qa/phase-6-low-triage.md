# Phase 6 Low backlog triage

Issue #235 (split from #230). Triage of every open Low as of `origin/main` 40d79e8 (2026-10-18). QA read each issue body and each comment, then checked the claim against the tree at that commit.

Decisions:

- **Fixed**: already fixed. Evidence cites the file at 40d79e8 or the PR.
- **Fix now**: still valid and cheap. A small fix issue carries the `phase-6` label and an owner.
- **Phase 8**: still valid and larger, or low value before launch. It moves to the Phase 8 milestone with a target and the reason.
- **Closed**: no longer valid. The reason is in the row.

Status of this file: PARTIAL. Sections 1 and 2 are complete. Sections 3 to 6 list what is still to be decided.

## 1. CodeQL alerts 14 and 15

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| CQ-14 | `js/incomplete-multi-character-sanitization` at `src/lib/claims/check.ts:45` (`<!--` strip) | Fix now | app-data-engineer, phase-6 | `visibleText` is the only caller path (line 186, number counting). Output is never rendered, so impact is Low (Security, `docs/security/reviews/phase-1.md:82`). Same class as alert 13, dismissed as false positive on 2026-10-17. Security asked for a clean scan at the start of Phase 6. Fix by stripping in a loop until the text stops changing, as `stripHtmlComments` does in `.github/scripts/pr-process.mjs:133`. Fallback if the owner prefers: Security dismisses with the alert 13 reason. |
| CQ-15 | Same rule at `check.ts:51` (`<script` / tag strip) | Fix now | app-data-engineer, phase-6 | Same evidence and same fix as CQ-14. One issue covers both. |

## 2. Older carried Lows

| ID | Item | Decision | Owner / target | Evidence |
| --- | --- | --- | --- | --- |
| #91-1 | `isoDate` rejects impossible dates (`2000-13-45`, `2000-02-30`) | Fix now | app-data-engineer, phase-6 | `src/lib/content/schemas.ts:6` is still `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`. |
| #91-2 | Tighten application string and array bounds | Fix now | app-data-engineer, phase-6 | The `/for` generator shipped in Phase 4 (PR #218), so real sizes exist. Same fix issue as #91-1. |
| #91-3 | `/for` route checks slug and expiry itself | Fixed | PR #219 | `src/pages/for/[slug].astro` rejects a bad slug in `getStaticPaths` and renders the expired notice when `isExpired`. |
| #111-1 | `.gitleaks.toml` with the R-501 job-description rule | Fix now | security-engineer, phase-6 | `.gitleaks.toml` does not exist at 40d79e8. The Phase 6 assessment runs secret scans, so it belongs here. ADR-0028 defers it from the golden set; it still guards the public repo. |
| #111-2 | commitlint hang on a long unwrapped body line | Phase 8 | platform-engineer, 2027-01-31 | Local-only slowdown on a pathological commit message. No public effect. |
| #111-3 | lint-staged shares the git stash stack | Phase 8 | platform-engineer, 2027-01-31 | Risk is to agent worktrees, not the site. Needs a decision (`--no-stash`) with the autopilot work (#116). |
| #111-4 | R-501 regexes case sensitive; merge, revert and fixup headers skip R-105 and R-106 | Phase 8 | platform-engineer, 2027-01-31 | Confirmed in PR #109 review; hook-only, input-side controls hold (ADR-0018). |
| #111-5 | Document the shared `core.hooksPath` in `docs/runbooks/git-hooks.md` | Fix now | platform-engineer, phase-6 | One paragraph. Fold into the platform docs fix issue. |
| #126-1 | Glyphs U+2192, U+2197, U+25CF, U+25CB: header lists only ranges the files hold | Fixed | PR #200, d3dba98 | Design Lead gate record accepted the system-font arrows. The remaining text change is `src/styles/fonts.css` header ("accepted, spec 2.4"): Fix now, frontend-engineer. |
| #126-2 | OFL text ships next to the fonts | Fixed | `public/fonts/OFL.txt` | Present at 40d79e8. |
| #126-3 | `base.css` uses family tokens, not its own `--stack-serif` and `--stack-mono` | Fix now | frontend-engineer, phase-6 | `src/styles/base.css:8-9` still defines both stacks. |
| #126-4 | `assets.test.ts` catches `<style>` in `.astro` | Fixed | `src/styles/assets.test.ts:47` | Test asserts no `<style`. The `<script` and `<style` checks are case sensitive (PR #226 note): Fix now with the `i` flag, frontend-engineer. |
| #127-1 | `checkPins` regex forms (`uses : x@v4`, flow maps, quoted key, next-line value, `docker://`) | Phase 8 | platform-engineer, 2027-01-31 | `sha_pinning_required` is live on the repo and is the real control. CI runs from a fixed workflow set that Security reviews. |
| #127-2 | `PHASE_GATE_TEST=1` re-enables the gate fixtures; print the data source | Fix now | platform-engineer, phase-6 | Small output change in `scripts/phase-gate.mjs`. The Phase 6 gate runs this script, so a forged run should be visible. |
| #127-3 | Entry guard `import.meta.url === file://${argv[1]}` skips `main` through a symlink | Fix now | platform-engineer, phase-6 | macOS `/tmp` is a symlink. A silent exit 0 reads as a pass. Same issue as #127-2. |
| #156-1 | Inline-code scan also reads built `*.svg` | Fix now | qa-engineer, phase-6 | An SVG asset now ships (`dist/_astro/graph-paper.*.svg`, no `<style` or `style=` today). The scan reads HTML only, so a later SVG could carry inline style unseen. Small addition to `tests/e2e/headers-checks.ts`. |
| #156-2 | `javascript:` check decodes HTML entities first | Fix now | qa-engineer, phase-6 | Small change in `tests/e2e/headers-checks.ts`. The /for and print pages exist now, which also covers #156-3. |
| #156-3 | Re-run headers test against real `/for` and `/print` pages | Fix now | qa-engineer, phase-6 | Both exist (Phase 4). Platform builds the cross-browser headers suite in #230. |
| #156-4 | CI step "Headers test (R-505)" fails when the test files are missing | Fix now | platform-engineer, phase-6 | CI file; Security review applies. |
| #159-1 | 135-L1 unclosed `<!--` hides `Closes #N` (CodeQL 11) | Fixed | `.github/scripts/pr-process.mjs:133` | Loop scans from the start after each cut and runs an unterminated comment to the end. |
| #159-2 | 135-L2 `headMatches` accepts a short prefix | Fixed | `pr-process.mjs:331` | Requires 40 hex characters. |
| #159-3 | 135-L4 CHANGES REQUESTED blocks only a required role | Fixed | `pr-process.mjs:403` | `R-201 <role> requested changes at the current head` is in place. |
| #159-4 | 135-L3 (Findings section), 135-L5 (3000 file cap), 135-L6 (labeler path gaps), 135-L7 (log injection), 135-L8 (runbook wording, rerun gate before merge, bootstrap fallbacks) | Fix now | platform-engineer, phase-6 | Each is a small script or doc edit. 135-L8(a) is a truth-in-docs point that Security flagged. One fix issue, in `.github/scripts`. |
| #153 | npm script re-enable gaps (136-L2) | Phase 8 | supervisor, 2027-01-31 | Already moved by ADR-0024. CI installs with `--ignore-scripts` (R-507); `.npmrc` changes show in the PR diff. |
| #128-1 | lychee `--index-files index.html` | Fix now | platform-engineer, phase-6 | Needed before section links ship; the home page has them. |
| #128-2 | CI steps print their rule ID on failure | Phase 8 | platform-engineer, 2027-01-31 | Convenience only. |
| #128-3 | R-807 check counts uncommitted `.claude/` edits | Closed | n/a | R-807 is retired (ADR-0026). |
| #128-4 | phase-gate skill renews interaction limit; document `--next-gate` | Fix now | supervisor, phase-6 | Interaction limit expires 2027-04-16; the gate runs in this phase. |
| #123-1 | Skill alias `function calling` on "Tool calling" | Fix now | app-data-engineer, phase-6 | Alias audit finding from PR #119; PR #201 lists plain-English alias risk (see #195). One alias-hygiene issue. |
| #123-2 | Alias `agent orchestrat` (stem) | Fix now | app-data-engineer, phase-6 | Same issue. |
| #123-3 | Aliases `anthropic`, `openai` match company names | Fix now | app-data-engineer, phase-6 | Same issue. |
| #123-4 | Spec notes the longest-match rule | Fix now | supervisor, phase-6 | No `longest` wording in `docs/spec/06-architecture.md` or `src/lib/fitcheck/` at 40d79e8. App/Data confirms what the matcher does, then the spec states it. |
| #123-5 | Property test for skill count, reference match, verbatim role summaries | Fix now | qa-engineer, phase-6 | `tests/property/` has the alias audit and engine properties; none asserts the skill count or verbatim role summaries. QA-owned. |
| #121-1 to 6 | Preview server follow-ups (404 for rejected paths, fail without `_headers`, header-name check, symlinks outside `dist/`, runbook, CODEOWNERS) | Phase 8 | platform-engineer, 2027-01-31 | `scripts/preview.mjs` is a local tool; Cloudflare serves production. Exceptions: the CODEOWNERS paths (Fix now, platform-engineer). |
| #116 | Autopilot loop | Phase 8 | platform-engineer, 2027-01-31 | Feature, not a Low. Needs the client's CLI. Already Phase 8. |
| #95 | Lint gate bypasses (85-L1 to L4) | Fix now | platform-engineer, phase-6 | Security's trigger "must close before any fit-check code merges" was missed: `src/lib/fitcheck/` merged in Phase 3 (PR #201) and `eslint.config.mjs` and `.stylelintrc.mjs` still have no `noInlineConfig` or `ignoreDisables`. Reported to the Supervisor as a process miss; severity stays Low under ADR-0018 because CSP `script-src 'self'` backs the rules. |
| #75 | Probe test part 2 in an authenticated session | Phase 8 | supervisor, 2027-01-31 | Cannot run headless without a login (ADR-0024). |
| #72 | Phase 7: Cloudflare token stays in the private repo; tag ruleset | Phase 8 | platform-engineer, Phase 7 launch | Already Phase 7. The tag ruleset is a Phase 7 deploy precondition. |
| #63 | Hook and client-step follow-ups (53-L4, L5, I3, 67-I1, I2, `2>&1` false deny) | Phase 8 | supervisor, 2027-01-31 | Already moved by ADR-0024. |
| #54 | guard-bash stdin, wrapper and fail-open routes | Phase 8 | supervisor, 2027-01-31 | Already moved by ADR-0024. |
| #47 | Hook gaps (HUSKY=0, interpreters, R-112 via shell) | Phase 8 | supervisor, 2027-01-31 | Already Phase 8. |
| #220-1 | `fc-size-ratio` sentence fails R-301 | Fixed | PR #219 | `src/content/claims-allowlist.json` has the 9.1 entries. |
| #220-2 | Move `resume-pdf.ts` to `scripts/` | Fixed | PR #219 | `scripts/resume-pdf.ts` is in the build script. |
| #220-3 | `public/resume/*.pdf` in `.gitignore` | Closed | n/a | The script writes to `dist/resume/` only. |
| #221 | `/for` claims check and Chromium in the production build | Phase 8 | platform-engineer, Phase 7 deploy | Already Phase 7. |
| #203 | Favicon and OG image | Fix now | design-lead, phase-6 | Already Phase 6 and carried in #229. |

## 3. Phase 1 backlog (#163): to do

Not yet decided: all lines. Lines to decide, grouped by comment: PR #135, #158, #149, #165 (eight lines), #172, #114, #182 (L1 to L5), #164 and the audit-1 follow-ups, #174, #185 (nine lines), #189, #199, #202 (three rounds), #204 (five rounds), #207.

## 4. Phase 2 backlog (#190): to do

Not yet decided: PR #186 (L1 to L7), #187 (Security and QA), #198, #200, #206, Reader Advocate list.

## 5. Phase 3 backlog (#195): to do

Not yet decided: PR #201 (two rounds), #208 (two rounds), #210.

## 6. Phase 4 backlog (#215): to do

Not yet decided: PR #216 (two rounds), #217, #218, #219, #223 (two lists), #226, #227.

#233 (Phase 6) has no lines.
