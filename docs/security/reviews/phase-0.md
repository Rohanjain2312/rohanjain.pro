# Security reviews: Phase 0

Owner: security-engineer · Issue: #39 · Written 2026-10-16 against `main` 5560169

This file has one entry per Security review comment posted on a Phase 0 PR, in PR order, with re-reviews under their PR. Dates are the UTC time of the comment. Finding IDs are `<PR>-<severity letter><n>`. Status is the state when the PR merged unless it says otherwise. Supervisor and Design reviews are not Security reviews and are not listed. PR #68 is the last Phase 0 PR with a Security review.

## Phase summary

### Reviews

| PR | Reviews (heads) | Final result | Merged |
|---|---|---|---|
| #2 | 7ef4190 CHANGES REQUESTED, 901a2c7 APPROVED | APPROVED | 2026-10-15 |
| #34 | d519405 APPROVED, 83a8970 CHANGES REQUESTED, 984ba2c APPROVED | APPROVED | 2026-10-16 |
| #35 | 5d80799 APPROVED, 1dc7af8 CHANGES REQUESTED, 7796922 APPROVED | APPROVED | 2026-10-16 |
| #36 | abac347 CHANGES REQUESTED, 60b2f1f CHANGES REQUESTED, a269397 APPROVED | APPROVED | 2026-10-16 |
| #37 | e343c1a APPROVED | APPROVED | 2026-10-16 |
| #40 | 3d04a71 CHANGES REQUESTED | in review (this PR) | open |
| #48 | 6723187 APPROVED | APPROVED | 2026-10-16 |
| #49 | d82a431 CHANGES REQUESTED, d8e47ef APPROVED | APPROVED | 2026-10-16 |
| #52 | 916bb1c APPROVED | APPROVED | 2026-10-16 |
| #53 | 831a136 CHANGES REQUESTED, 2af3867 APPROVED | APPROVED | 2026-10-16 |
| #55 | dab006b CHANGES REQUESTED, cb25b10 APPROVED | APPROVED | 2026-10-16 |
| #65 | 62dba4f APPROVED | APPROVED | 2026-10-16 |
| #67 | 75a52f4 APPROVED | APPROVED | 2026-10-16 |
| #68 | 321b351 APPROVED | APPROVED | 2026-10-16 |

Each merged PR was merged at the head that holds the last Security APPROVED (checked against `gh pr list --state merged`). No PR merged while a Medium or higher finding of its own was open.

### Findings by severity

| Severity | Found | Open at 2026-10-16 |
|---|---|---|
| Critical | 0 | 0 |
| High | 0 | 0 |
| Medium | 7 | 0 |
| Low | 43 in PR reviews (a finding raised again in a re-review counts once) | 7 |
| Info | listed in each entry, not totalled | not applicable |

Low findings per PR: #2: 1, #34: 3, #35: 5, #36: 4, #37: 4, #40: 1, #48: 2, #49: 4, #52: 2, #53: 5, #55: 7, #65: 2, #68: 3. Medium findings #44, #45 and #46 came from the threat model (issue #5, `docs/security/threat-model.md`), not from a PR review. #9, #60, #61 and #62 came from PR reviews.

### Medium findings and how each was closed

| Issue | Finding | Found in | Closed by | Closed (UTC) |
|---|---|---|---|---|
| #9 | `guard-bash` missed `gh issue`, `gh api` and `gh pr create` routes to approvals, review comments, merges and rulesets | PR #2 review | PR #2 (fix at 901a2c7, verified in the second review) | 2026-10-15 23:08 |
| #44 | `/for` application files in the public repo exposed every application | threat model (#5) | PR #55: ADR-0016 (result files only in the private repo), ADR-0017 (fix-PR terms under R-511) | 2026-10-16 02:46 |
| #45 | Public GitHub content could steer agents holding an all-repo token | threat model (#5) | PR #53: interaction limit and fork approval verified live, author rule in the skills, hook rules, ADR-0018 | 2026-10-16 02:45 |
| #46 | Local npm installs ran package install scripts | threat model (#5) | PR #52: `.npmrc` with `ignore-scripts=true`, Dependabot cooldown, runbook | 2026-10-16 02:37 |
| #60 | Token rule missed command substitution, `--show-token=true`, `git credential` | PR #53 review | PR #53 (fix at 2af3867, all 5 probe rows deny) | 2026-10-16 02:45 |
| #61 | Other-repo rule missed `GH_REPO=`, `-R<repo>`, `repositories/<id>`, GraphQL mutations, `git push --repo` | PR #53 review | PR #53 (fix at 2af3867, all 11 probe rows deny) | 2026-10-16 02:45 |
| #62 | ADR-0016 deploy design would leak `/for` pages through public Actions logs, artifacts and a repo-wide secret | PR #55 review | PR #55 (ADR-0016 moves the production build, deploy and cleanup to the private repo) | 2026-10-16 02:46 |

Residual risk accepted by ADR: ADR-0018 accepts that a steered agent can reach the all-repo token through interpreter indirection (`node -e`, `python3 -c`). It is listed in `docs/needs-client.md` under "Optional (accepted risk, ADR-0018)" and in the threat model as RR-11. ADR-0014 accepted the paused signed-commit rule; PR #68 ended that acceptance and restored the rule.

### Open Low findings

From `gh issue list --label severity:low --state open` on 2026-10-16.

| Issue | Finding | Target |
|---|---|---|
| #42 | Labeler has no Security path set (workflows, `.npmrc`, `_headers`, gate scripts) | before #14 starts (Phase 1) |
| #47 | Hook gaps: R-116 via `HUSKY=0` or `core.hooksPath`, R-509 via interpreters, R-112 via shell writes | 2026-10-29 (Phase 1, with #14) |
| #51 | `guard-write`: `..` in absolute worktree paths bypasses R-112 | milestone Phase 0, with #32 or #47 |
| #54 | `guard-bash`: stdin, expansion and wrapper routes remain after #37; hook fails open on hang | 2026-10-29 (Phase 1, with #47) |
| #56 | Design spec drops the 80-character cap on fit-check company and role fields | 2026-10-29 (Phase 1) |
| #58 | No hook blocks turning npm install scripts back on | before the Phase 1 gate, with #47 |
| #63 | Hook and client-step follow-ups from PR #53 (keychain reads, `gh alias`, clone-dir targeting, token step wording) | Phase 1 |

#51 sits in the Phase 0 milestone and is still open. It is Low, so it does not block the gate under R-511, but the Supervisor should move it or fix it. Two more Low findings have no issue of their own: 53-L3 is a requirement on #16 (open), and 55-L7 (Phase 7 token placement) is recorded only in the PR #55 comments. The Phase 7 deploy issue does not exist yet. Create it with the 55-L7 criteria, or open a Low issue with a target date (spec 8.9).

Open client item that affects a Security control: RR-8 in the threat model. The shared gh token still holds `write:ssh_signing_key` until the client runs `gh auth refresh -h github.com -r write:ssh_signing_key` (`docs/needs-client.md`). Verified live on 2026-10-16: `gh auth status` still lists the scope, and the account has one signing key.

### Escaped defects

Defects that Security missed in a review and that someone found later. Each has a memory entry in `.claude/agent-memory/security-engineer/`.

| Defect | Missed in | Found by | Memory |
|---|---|---|---|
| CODEOWNERS listed `tokens.css` and `src/assets/brand/` under the wrong role (36-L4) | PR #36 first review (read by eye) | Security re-review at 60b2f1f, with a script | `escaped_defects.md` |
| `guard-write` accepts `..` in absolute worktree paths (#51) | PR #2 reviews (probed `guard-bash` only) | Security, PR #35 review | `escaped_hook_path_traversal.md` |
| Hook gaps for R-116, R-509 and R-112 (#47) | PR #2 reviews (read every hook) | Security, threat model | `hook_review_checklist.md` |
| ADR-0014 asked for `admin:ssh_signing_key`, which brought back the issue fixed in #43 (34-L2); "Closes #38" while #38 criterion 2 was not done (34-L3) | PR #34 approval at d519405 | Security re-review at 83a8970 | `feedback_review_checklist.md` |
| Threat model statuses described closed findings as open, and old live settings (49-L1 to 49-L4) | PR #49 as written by Security | independent Security review of PR #49 | `review-stale-status.md` |
| This log recorded only PR #36 (40-L1) | PR #40 as first written | independent Security review of PR #40 | `escaped_defects.md` |
| `docs/status.md` named the issue (#50) instead of the PR (#65) | PR #65 review | Design review | none (Info, no security effect) |

## PR #2: bootstrap repository (issue #1)

### Review at `7ef41908ca87bfa427c3ed6e31f0837f5d85edbc`

- Date: 2026-10-15 23:04
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/2#issuecomment-6204111610
- Checks: hook tests 54 passed; `lint-docs` 0 errors; SHA-256 of all 13 `reference/` files matches the client originals; base is the empty root commit 4d29441 and the PR only adds files (ADR-0013); ruleset 25204664 active with no bypass actors; secret grep found nothing (gitleaks not installed); `.gitignore` and settings deny `.env*`, `*.pem`, `*.key`, `postings/`, `*.jd.txt`; R-007 grep matches only the rules that ban it; PNG and docx metadata hold nothing sensitive. Every hook read and `guard-bash` probed with synthetic input.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 2-M1 | Medium | `guard-bash.mjs` enforced R-203 and R-111 only on `gh pr comment/edit/merge`. Seven routes passed: `gh issue edit --add-label`, `gh api .../labels`, `gh pr create --label`, `gh issue comment` with a forged `Reviewer:` body, `gh api PUT .../merge`, `gh api DELETE .../rulesets`. All agents share one GitHub identity, so the hook is the only control. | closed #9 (fixed in PR) |
| 2-I1 | Info | The résumé docx links the settlement demo to a local `file:///Users/...` path. Use the https URL in `resume.json` and the PDFs. | carried to #25 (note posted) |
| 2-I2 | Info | The mockups load Google Fonts. The site self-hosts fonts (`font-src 'self'`). | carried to the design spec (PR #48) |
| 2-I3 | Info | PR commits are unsigned. `main` stays compliant because the squash merge is signed by GitHub. | no action |
| 2-I4 | Info | Phone and email in the public repo are client-accepted (§8.1). | accepted by the client |

### Review at `901a2c7f389b755291ff22ef9f0ec64e8cd11b52`

- Date: 2026-10-15 23:09
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/2#issuecomment-6204170214
- Checks: only `guard-bash.mjs` and `test-hooks.mjs` changed since 7ef4190; 74 hook tests; all 7 former allow rows now deny; 17 more bypass variants deny and 5 legitimate cases allow (`--add-label=`, comma lists, `-XPOST`, `--method=`, `-F`, `--field=`, `{owner}/{repo}` paths, full URLs, URL-encoded label DELETE, lowercase `-X delete`, GraphQL `mergePullRequest` and `deleteRepositoryRuleset`). No open Medium or higher issue. #9 verified and closed.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 2-L1 | Low | The hook cannot see bodies or queries passed indirectly or behind wrappers: `--body-file -`, `--body-file=path`, `--body "$(cat f)"`, `gh api -F body=@f`, `gh api graphql -F query=@f`, `env gh`, `sh -c 'gh ...'`. | closed #32 (PR #37) |

## PR #34: ADRs 0001 to 0012 and 0014 (issues #4, #38)

### Review at `d519405a3e32f6d7f854253d53a77192f22f7305`

- Date: 2026-10-15 23:14
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/34#issuecomment-6204245681
- Checks: 14 files added under `docs/adr/`; every ADR has Status, Date, Context, Decision, Consequences, Alternatives; no U+2014; README links resolve; decisions match the spec and cited rule IDs exist; ADR-0009 and ADR-0014 claims match live settings (`gh api` for repo, ruleset, vulnerability alerts); `9a325a0` verified; no secrets.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 34-L1 | Low | Root commit `4d29441` (empty tree) is unsigned, so the R-107 gate check trips unless the exception is written down. | closed #38 (PR #34, second re-review) |
| 34-I1 | Info | ADR-0009 and ADR-0014 point to a `docs/needs-client.md` item that arrives with PR #35. Merge #35 with or before #34. | done (PR #35 merged first) |
| 34-I2 | Info | Some alternatives carry reasons the spec does not list (ADR-0003, ADR-0008). Rationale, not claims. | no action |
| 34-I3 | Info | ADR-0014 rides in the #4 PR although its work item is #33. | accepted |

### Review at `83a89701de1c0bc6327c074d600e95610c691111`

- Date: 2026-10-16 02:51
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/34#issuecomment-6206939435
- Checks: 14 files in `docs/adr/`; ADR-0007 text matches the ADR-0016 amendment; README indexes 0001 to 0014 and 0016 to 0018; lint 0 errors; ADR-0014 and ADR-0009 against the live ruleset (8 of 9 `main` commits verified, `4d29441` unsigned); the phase-gate skill had no R-107 check. The approval at d519405 was removed as stale (R-208).

| ID | Severity | Finding | Status |
|---|---|---|---|
| 34-L2 | Low | ADR-0014 said the key upload needs `admin:ssh_signing_key`. It needs `write:ssh_signing_key`. This brought back the issue fixed in #43. | fixed in PR |
| 34-L3 | Low | "Closes #38" while #38 criterion 2 (a phase-gate R-107 check naming `4d29441`) was not met. | fixed in PR |
| 34-I4 | Info | The ruleset has no required status checks rule. Tracked in #14. | known, Phase 1 |

34-L2 and 34-L3 are escaped defects of the first review (see the phase summary).

### Review at `984ba2c2b3efd7bd9409f033ae5d05e75579ca06`

- Date: 2026-10-16 02:54
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/34#issuecomment-6206973305
- Checks: `git diff 83a8970 984ba2c` touches ADR-0014 and the phase-gate skill. 34-L2 and 34-L3 fixed and verified. Phase-gate step 7 ran against `main` and printed only `4d29441`. Lint 0 errors; no U+2014.
- Findings: no Critical, High, Medium or Low. Info: the skill change needs a probe-test rerun before the Phase 0 gate (R-807). `gh pr checks` shows no checks, tracked in #14.

## PR #35: Phase 0 and Phase 1 plans and backlog (issue #7)

### Review at `5d80799f4ee4bf483a5e7706390405a9dddcf158`

- Date: 2026-10-16 02:28
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/35#issuecomment-6206686213
- Checks: 12 files, 4 commits; hook tests 74 passed; lint 0 errors; no secrets (grep); `owners.json` against each agent file; `guard-write` probed (own memory allowed, other roles' memory, `.claude/settings.json` and `.npmrc` denied); Phase 1 backlog #10 to #31 complete with security notes; `needs-client.md` steps fit client-only item 1; live ruleset matches.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 35-L1 | Low | `phase-0-plan.md` said the ruleset includes signed commits. | closed #41 (fixed in PR) |
| 35-L2 | Low | `needs-client.md` asks for `admin:ssh_signing_key`. `write:` is enough. | closed #43 (fixed in PR, two steps) |
| 35-L3 | Low | #14 labeler has no Security path set. | open #42 (Phase 1) |
| 35-L4 | Low | The Phase 1 plan says the `file:///` link is logged for #25, but #25 had no note. | fixed in PR (comment on #25) |
| 35-L5 | Low | `repoRel()` does not normalize `..` in absolute worktree paths (pre-existing on `main`). | open #51 |
| 35-I1 | Info | `guard-read` blocks the Reader Advocate from its own memory folder. | not confirmed: `guard-read.mjs` on `main` has no `agent-memory` entry; re-check in the Phase 1 hook work (#47) |
| 35-I2 | Info | `.npmrc` now belongs to Platform. Set `ignore-scripts=true` (#46) and add it to the Security path set (#42). | done (PR #52) |
| 35-I3 | Info | Open Medium findings #44, #45, #46 block the Phase 0 and 1 gates under R-511. | closed (see summary) |

### Review at `1dc7af824b0b945f6f0e90df09fff8c5a39f03be`

- Date: 2026-10-16 02:32
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/35#issuecomment-6206724813
- Checks: 35-L1 (#41), 35-L2 part 1 and 35-L4 fixed. Lint 0 errors; hook tests 74 passed. The approval at 5d80799 was removed as stale.
- Finding: 35-L2 part 2 (Low, #43): nothing told anyone to remove the signing-key scope after the upload. Fixed at 7796922.
- Info: #25's body still says "Security notes: None". The comment is enough.

### Review at `779692271e92e35e412a23288208e8efc28b7d18`

- Date: 2026-10-16 02:33
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/35#issuecomment-6206739414
- Checks: `needs-client.md` now tells the client to run `gh auth refresh -h github.com -r write:ssh_signing_key` after #33; #33's criteria list the removal. Lint 0 errors; hook tests 74 passed.
- Findings: Info only. The two steps wait on each other (the client step starts "when #33 is closed", and #33 needs the scope removed first); the goal is met because #33 cannot close while the scope remains. The new #33 criterion sat below the "Note:" line.

## PR #36: issue and PR templates, CODEOWNERS, repo settings runbook (issue #3)

### Review at `abac3478065c04a277598f461ba9c4dad48562f2`

- Date: 2026-10-15 23:15
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/36#issuecomment-6204254315

| ID | Severity | Finding | Status |
|---|---|---|---|
| 36-L1 | Low | CODEOWNERS leaves out the platform-engineer scripts `lint-docs.mjs`, `autopilot.sh`, `phase-gate.mjs` and `verify.mjs`, so they fall under the app-data-engineer `/scripts/` entry. | fixed in PR |
| 36-L2 | Low | The runbook is out of date: Phase 7 and 8 milestones now exist, and the `accessibility` label is not listed. | fixed in PR |
| 36-L3 | Low | The runbook calls `required_signatures` "paused", but the rule is not in the ruleset. It cites ADR 0014, which is not on main. | fixed in PR |
| 36-I1 | Info | The runbook leaves out Actions controls: default workflow permissions read, Actions cannot approve PRs, fork PR approval policy, ruleset `require_extra_approval_for_unattributed_changes: true`. | done |
| 36-I2 | Info | `sha_pinning_required` is false and `allowed_actions` is all. Turn on SHA pinning before the Phase 1 workflows. | done (now true) |
| 36-I3 | Info | The PR template fills in "none" under New dependencies. | done |
| 36-I4 | Info | Owner role in the issue template is free text, not a dropdown. | done |
| 36-I5 | Info | Auto-merge is allowed and, until Phase 1, there are no required status checks, so merges are enforced only by the hooks. | known, tracked by Phase 1 |

### Review at `60b2f1ffdbecf2aaf740a6970d21a3894923136a`

- Date: 2026-10-16 02:25
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/36#issuecomment-6206649945
- 36-L1, 36-L2, 36-L3: fixed and verified with `gh api`. 36-I1 to 36-I4: done.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 36-L4 | Low | `src/styles/tokens.css` and `src/assets/brand/` are listed again under the frontend-engineer heading, after the broader patterns. With last match wins, they map to frontend-engineer instead of design-lead. I missed this in the first review. | fixed in PR |
| 36-I6 | Info | `package.json` and its lockfile are shared by four roles but listed only under platform-engineer. | done (header comment) |

### Review at `a2693971250b357b67564f4ea10b23956a3599f5`

- Date: 2026-10-16 02:27
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/36#issuecomment-6206674048
- Checks: a script resolved every `owners.json` pattern to its role in CODEOWNERS (each pattern under its own heading; for each `!` exclusion the last matching line belongs to another role; no extra patterns). `gh api .../codeowners/errors` returns no errors. The runbook matches live settings (ruleset, Actions permissions, 9 milestones, 50 labels, merge options, push protection). 282 lines changed (R-109).
- Findings: none open. 36-L4 and 36-I6 fixed. 36-I5 stays known.

## PR #37: close indirect routes for reviews and approval labels (issue #32)

### Review at `e343c1a9e54b322e3e080a996842b77ef87c250f`

- Date: 2026-10-16 02:31
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/37#issuecomment-6206714623
- Checks: only `guard-bash.mjs` and `test-hooks.mjs` change; all 7 rows of #32 deny at head and allow on `main`; 86 hook tests pass; lint 0 errors. Regression probe of 38 commands in the class and 10 legitimate commands against head and `main`; own-role reviews through `--body-file`, quoted heredoc and `$(cat <<'EOF')` still allow. The hook timeout is 15 s and a timed-out PreToolUse hook does not block (Claude Code docs).

| ID | Severity | Finding | Status |
|---|---|---|---|
| 37-L1 | Low | The `--body-file -` path takes the first `Reviewer:` line and any `<<`. A pipe with a trailing `# <<`, `<<<`, an unquoted heredoc, `: <<` inside `$()` and a decoy line bypass it. Also allowed on `main`. | open #54 |
| 37-L2 | Low | Stdin, variable and same-command file forms still pass (`-F query=@-`, `--input -`, `--body-file /dev/stdin`, `<(...)`, `--body "$B"`). | open #54 |
| 37-L3 | Low | Wrappers are not unwrapped: `env -u`, `timeout`, `nice`, `eval`, `( )`, `{ }`, `&`, `if`, `$(gh ...)`, absolute path to `gh`, `\| sh`, `xargs`. | open #54 |
| 37-L4 | Low | The hook fails open: `-F q=@/dev/zero` hangs it until the timeout and the rest of a compound command goes unchecked. New in this PR for that form. Fix: `onFailure: block`, regular files only, size cap. | open #54 |
| 37-I1 | Info | A single-quoted `--body` containing backticks is now denied (fails closed). | accepted |

## PR #40: this log (issue #39)

### Review at `3d04a7153cbda60ac354c4c892c466fb6eb5d356`

- Date: 2026-10-16 02:27
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/40#issuecomment-6206664664
- Checks: only security-owned paths changed (R-112); lint 0 errors; no secrets, job description text, R-007 terms or U+2014 in the memory files; no memory file overrides CLAUDE.md, `docs/rules.md` or the hooks. Each "environment quirk" checked by hand (`gh pr edit` is broken on gh 2.63.2; the label route is still role-checked by R-203). Memory facts matched the live ruleset, milestones and `owners.json`.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 40-L1 | Low | The log held only PR #36. Records for PR #2 (two reviews) and PR #34 were missing. | fixed in this PR (this file) |
| 40-I1 | Info | Branch `security/9-review-pr2` had a second `phase-0.md` with no PR. | folded in, branch deleted |
| 40-I2 | Info | Two omissions in the #36 entry (36-I1 ruleset setting, 36-I5 auto-merge). | fixed in this PR |
| 40-I3 | Info | PR #40 changes `.claude/**` and needs `needs:security-review` (R-209). | label added by hand |
| 40-I4 | Info | Two nits in the memory file: one of the four platform files is `autopilot.sh`, and the label tip should use `-f 'labels[]=<label>'`. | fixed in this PR |

## PR #48: design spec outline (issue #6)

### Review at `6723187b86c81885259030d473c3d751a0251e0c`

- Date: 2026-10-16 02:34
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/48#issuecomment-6206746659
- Checks: 4 files; the spec fits CSP §8.2 (no Google Fonts, no inline styles or `<style>`; only origin named is `*.hf.space`); demo embed keeps the screenshot first (R-512); the textarea keeps its 8,000 cap; no phone in OG or meta (R-305); `/for` stays noindex; R-007 grep 0; no secrets; the three design-lead memory files hold no overrides; lint 0 errors.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 48-L1 | Low | The spec drops the mockup's 80-character cap on company and role fields (§8.3 needs every input capped). | open #56 (2026-10-29) |
| 48-L2 | Low | No role owned `.claude/agent-memory/<role>/` in `owners.json`, so the Write hook denied design-lead there. | fixed by PR #35 (noted on #47) |
| 48-I1 | Info | Q-36: new `/for` prose fields grow the schema that #44 covers. Decide #44 first. | done (ADR-0016) |
| 48-I2 | Info | Q-37: a per-application OG card must live under `/for/<slug>/` so `X-Robots-Tag` and `no-store` apply. | recommendation |
| 48-I3 | Info | Set Astro `build.inlineStylesheets: 'never'`; fonts must not become `data:` URIs. | carried to #21 |
| 48-I4 | Info | Two 404 citations are off by one line. | design accuracy |
| 48-I5 | Info | The 1200 by 630 OG size is the only value not drawn from the mockup. It is framed as a question (Q-53). | accepted |

## PR #49: threat model (issue #5)

### Review at `d82a4316c64ce31f78a36fd4caddda111263bcd2`

- Date: 2026-10-16 02:51
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/49#issuecomment-6206949538
- Checks: issue #5 criteria 1 to 4 pass (A1 to A12, DF1 to DF7, boundaries B1 to B9 with STRIDE tables, RR-1 to RR-10 with owners). Register statuses compared with `main` e4cc79f and live `gh api`. The section 6.2 probe re-run against `main` hooks. Merged tree: lint 0 errors, 125 hook tests pass. Memory files: no secrets and no overrides.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 49-L1 | Low | Section 7 and the STRIDE status column treated closed Medium findings (#44 to #46, #60 to #62) and merged PRs as open. | fixed in PR |
| 49-L2 | Low | Section 8 omitted the residual risk ADR-0018 accepts; sources stopped at ADR-0014. | fixed in PR (RR-11) |
| 49-L3 | Low | Open Low findings #51, #54, #58, #63 were missing from the rows and the 6.2 table. | fixed in PR |
| 49-L4 | Low | Live settings were out of date: interaction limit, fork approval policy, `sha_pinning_required`. | fixed in PR |
| 49-I1 | Info | Rows relied on ADRs that were still in open PR #34. | resolved when #34 merged |
| 49-I2 | Info | `severity-calibration.md` did not say #44 to #46 were closed or cite ADR-0018. | fixed in PR |

### Review at `d8e47eff46cbcfe32c7e8f18db957926314a7387`

- Date: 2026-10-16 03:00
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/49#issuecomment-6207048559
- Checks: rebased on `main` 989cc69; every cited issue number checked with `gh issue list --state all`; live interaction limit (`collaborators_only`, expires 2027-04-16), fork approval (`all_external_contributors`), `sha_pinning_required` true re-read; the 6.2 probe re-run from a `git archive` of 989cc69 matched the table; lint 0 errors; 125 hook tests; no em dashes.
- Findings: Info only (49-I3). The #63 exception (53-I3) was described as part of ADR-0018 before the ADR carried it. It makes ratings stricter, so no control is weaker. Read it as proposed until #63 lands.

## PR #52: turn off npm install scripts and add Dependabot cooldown (issue #46)

### Review at `916bb1c92d21e4fb8131db156a61fd20da3ee599`

- Date: 2026-10-16 02:35
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/52#issuecomment-6206762256
- Checks: `.npmrc` is exactly `ignore-scripts=true\n`; `npm config get ignore-scripts` prints `true` at the root; a scratch project with a package that has `preinstall`, `install` and `postinstall` ran none of them on `npm install` or `npm ci`; `npm rebuild <pkg> --ignore-scripts=false` runs only that package; `dependabot.yml` parsed and its keys match GitHub's reference; ownership checked with `ownsPath()`; no `package.json`, no new dependency, no workflow.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 52-L1 | Low | `.npmrc` has no owner in `owners.json`, so a later PR could weaken it without Security review. | closed #57 (PR #35 gave `.npmrc` to Platform) |
| 52-L2 | Low | No hook blocks `--ignore-scripts=false`, `npm_config_ignore_scripts=false` (verified: the env var beats the project `.npmrc`) or `npm rebuild --ignore-scripts=false` with no package name. | open #58 |
| 52-I1 | Info | With scripts off, `pre`/`post` scripts and the root `prepare` do not run. #10 must set up husky and gitleaks with explicit steps. | carried to #10 |
| 52-I2 | Info | Use `npx --no-install playwright install chromium`. | recommendation |
| 52-I3 | Info | Cooldown does not apply to security updates. Patch auto-merge after cooldown is not enforced yet. | check in #15 |
| 52-I4 | Info | Until `package.json` exists, subdirectories read `ignore-scripts` as `false`. | no action |

## PR #53: keep the token and other repos out of agents' reach (issue #45)

### Review at `831a136b8c1ed68c29461eff35ded0f24e6bdec0`

- Date: 2026-10-16 02:37
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/53#issuecomment-6206786060
- Checks: stacked on PR #37, so only its own commit was reviewed. Live interaction limit `collaborators_only` (expires 2027-04-16) and fork approval `all_external_contributors`. 101 hook tests pass; lint 0 errors. The three #45 probe rows deny. A script sent 49 plus 7 synthetic inputs; every miss was confirmed with a read-only live call (`gh auth status --show-token=false` parses; the hidden `gh auth git-credential` exists; `GH_REPO=<other> gh api 'repos/{owner}/{repo}'` returns the other repo; `-R<repo>` parses; `gh api repositories/<id>` returns the other repo).

| ID | Severity | Finding | Status |
|---|---|---|---|
| 53-M1 | Medium | The token rule misses `echo $(gh auth token)`, `X=$(gh auth token)`, `--show-token=true`, `gh auth git-credential get`, `git credential fill` and `GH_TOKEN=$(gh auth token) <tool>`. | closed #60 (fixed in PR) |
| 53-M2 | Medium | The other-repo write rule misses `GH_REPO=` prefixes, `-R<repo>`, `repositories/<id>`, GraphQL `updateRepository`, `createIssue`, `createCommitOnBranch`, `gh issue transfer`, `git push --repo=`, `git -c remote.origin.url`, `git config remote.origin.pushurl`. | closed #61 (fixed in PR) |
| 53-L1 | Low | Interpreter indirection (`node -e`, `python3 -c`) passes every rule. The hook is a tripwire, not a boundary. | accepted by ADR-0018, RR-11 |
| 53-L2 | Low | No ADR records the interaction limit and nothing renews it before 2027-04-16. | fixed in PR (ADR-0018, phase-gate step 7) |
| 53-I1 | Info | The author rule trusts anything by `Rohanjain2312`, and every agent posts as that account. Quote third-party text only in a fenced block marked as data. | fixed in PR |
| 53-I2 | Info | `writeEarly` duplicates `write`; `gh -R <other> issue list` was a false positive. | fixed in PR |

### Review at `2af386723cf3b1a42a22bfdcf35bb814a9306a0f`

- Date: 2026-10-16 02:44
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/53#issuecomment-6206869030
- Checks: 120 hook tests pass; lint 0 errors; live settings re-read; #45 rows (3), #60 rows (5) and #61 rows (11) all deny; the first-review probe (49 plus 7 rows) and 12 new rows re-run; reads of other repos still allow. ADR-0018 listed in `docs/needs-client.md` as accepted risk (R-511).

| ID | Severity | Finding | Status |
|---|---|---|---|
| 53-L3 | Low | ADR-0018 says the gate fails if the interaction limit lapses, but `scripts/phase-gate.mjs` does not exist yet. | open, requirement on #16 |
| 53-L4 | Low | The optional repo-scoped token step does not do what it says: git over HTTPS still uses the `osxkeychain` credential. Needs a keychain erase, `gh auth setup-git`, the Workflows permission and one sentence on the accepted risk. | fixed in PR #65, further steps in #63 and PR #67 |
| 53-L5 | Low | Tripwire gaps ADR-0018 accepts as Low: `security find-*-password -w`, `gh alias set`, commands in a clone of another repo, `python3 -c` with list arguments. | open #63 |
| 53-I3 | Info | ADR-0018 sets the severity of later bypass forms before they exist. Keep it as the default; patterns agents hit in normal work (such as `GH_TOKEN=$(gh auth token) <tool>`) are rated on likelihood. | #63 |
| 53-I4 | Info | `RAW_DENY` matches the whole command, so a `git commit -m` that mentions `gh auth token` is denied. Use `-F <file>`. | usability only |

## PR #55: keep application data out of the public repo (issue #44)

### Review at `dab006bea208cbdea6bd11432c63fa626ec60501`

- Date: 2026-10-16 02:38
- Result: CHANGES REQUESTED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/55#issuecomment-6206797048
- Checks: stacked on PR #53, so only its own commit was reviewed. 103 hook tests pass; lint 0 errors. A 16-form `git` probe against a scratch repo for the new `src/content/applications` rule. `.gitignore` had no entry; no history in that directory. ADR-0017 read against R-511 and the open finding labels.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 55-M1 | Medium | The ADR-0016 deploy design re-exposed what #44 hides: public Actions logs list every `/for` route, the build artifact can be downloaded by any signed-in user, a repository secret is readable by every workflow on any branch, and PR previews and `cleanup.yml` were not covered. | closed #62 (fixed in PR) |
| 55-L1 | Low | The hook rule stopped only the literal file path; the directory form and `git stage`, `git mv` passed. | fixed in PR |
| 55-L2 | Low | #44's CI tracked-file criterion was deferred to #13 without a record. | fixed in PR (ADR-0016 Decision 2) |
| 55-L3 | Low | The default `APPLICATIONS_DIR` is relative and resolves inside the public repo from an agent worktree. | fixed in PR (ADR-0016 Decision 3) |
| 55-L4 | Low | Stale text in 06-architecture, 08-security §8.1 and 10-cicd §10.2. | fixed in PR |
| 55-L5 | Low | ADR-0016 said "Amends: ADR-0007" without the new text. | fixed in PR |
| 55-L6 | Low | ADR-0017 needed exact terms so a check can apply it. | fixed in PR |
| 55-I1 | Info | 6 base32 characters is 30 bits. Enough against casual guessing; the Phase 6 `/for` enumeration test confirms the rate limit. | Phase 6 |

### Review at `cb25b10d5e4b6d249d140b7588fd891c0006eab8`

- Date: 2026-10-16 02:44
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/55#issuecomment-6206868627
- Checks: 125 hook tests; lint 0 errors. The 16-form probe now denies the directory form, trailing slash, `git stage`, `git mv`, `./` paths and the quoted glob. ADR-0016 Decisions 5 and 6 move the production build, deploy and cleanup to the private repo. ADR-0017 terms can be checked mechanically, and this stack qualifies (#37 merged, #53 closes #45 and #60, #55 closes #44 and #62). TM-1 text handed to PR #49.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 55-L7 | Low | 08-security §8.5 and 11-phases describe one Cloudflare API token without naming the repo. Keep the token in the private repo's `production` environment; drop or decide the PR preview deploys here by ADR; add the "no `/for/` route in logs, no `/for/` artifact" check to the Phase 7 deploy issue. | open, no issue yet (Phase 7 deploy issue does not exist) |
| 55-I1 | Info | The remaining hook bypass forms depend on #10 and #13, which ADR-0016 already requires before the generator. | known |
| 55-I2 | Info | Protect release tags in the Phase 7 ruleset, because the private build checks out this repo at a tag. | Phase 7 |

## PR #65: decide open design questions (issue #50)

### Review at `62dba4fc4b83e35f242880efbd2885fcf1d93197`

- Date: 2026-10-16 02:59
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/65#issuecomment-6207028512
- Checks: 5 files; lint 0 errors; no U+2014; no secret, phone or R-007 match; both commits signed; ADR-0015 answers every question in `docs/design/spec.md` §14; item 5 (no inline `style`, `<style>` or `<script>`) is stricter than §8.2 and needs no CSP change; the 53-L4 steps are present and the premise was checked locally (HTTPS remote, `osxkeychain` helper, gh token in the keyring); GitHub docs show Administration write includes `DELETE /repos/{owner}/{repo}`; `docs/status.md` open findings match `gh issue list`.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 65-L1 | Low | The optional token step conflicts with the required `gh auth refresh` steps (a later refresh replaces the fine-grained token). A fine-grained token cannot use a user-owned project board. | closed #66 (PR #67) |
| 65-L2 | Low | Administration write lets the fine-grained token delete this repository. The current classic token cannot. | closed #66 (PR #67) |
| 65-I1 | Info | The keychain step lists gh's own `gh:github.com` entry; deleting it logs gh out. Put the keychain step before step 2. | fixed (PR #67) |
| 65-I2 | Info | No token expiry stated (§8.6). | fixed (PR #67, 90 days) |
| 65-I3 | Info | Frontend: set `build.inlineStylesheets: 'never'`; avoid `define:vars`, `is:inline`, `set:html`; the headers CI test fails on any inline `<style>`, `<script>` or `style=` in `dist/`. | notes on #21 and #29 |
| 65-I4 | Info | Runtime fit-check bar sizes use CSSOM or SVG attributes, never `setAttribute('style', ...)` or HTML strings (§8.3 sinks). | note on #29 |
| 65-I5 | Info | Phase 4: R-502's schema rejects extra fields but not JD substrings inside allowed fields. Build prose from taxonomy terms and Rohan's evidence. | Phase 4 |

## PR #67: order the optional token step last (issue #66)

### Review at `75a52f417f73500cf05dba50bc8ea09d4c65746b`

- Date: 2026-10-16 03:01
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/67#issuecomment-6207056778
- Checks: only `docs/needs-client.md` changed; 65-L1, 65-L2, 65-I1, 65-I2 fixed; GitHub docs show that `PUT .../interaction-limits` and `POST .../rulesets` need Administration write; lint 0 errors; no em dash; commit signed.
- Findings: no Low or higher.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 67-I1 | Info | With Administration read only, the Supervisor cannot renew the interaction limit (ADR-0018's primary input control). Commands "for you to run" for settings must be browser steps, and the `phase-gate` skill should name the renewal as a client step when the fine-grained token is in use. Fails closed. | added to #63 |
| 67-I2 | Info | The step does not say what to do when the 90-day token expires. Fails closed. | added to #63 |
| 67-I3 | Info | The #21 note omits `build.inlineStylesheets: 'never'`. The #29 headers test would catch it. | recommendation |

## PR #68: restore the signed-commit rule (issue #33)

### Review at `321b35197708d8b7aa59c940c81799829768e95e`

- Date: 2026-10-16 07:27
- Result: APPROVED
- Comment: https://github.com/Rohanjain2312/rohanjain.pro/pull/68#issuecomment-6210386163
- Checks: two docs files only (ADR-0014 status line, `docs/needs-client.md`). Live ruleset 25204664: active, no bypass actors, rules deletion, non_fast_forward, required_linear_history, pull_request and `required_signatures`. The head commit is verified. `gh api user/ssh_signing_keys` lists one key and its blob matches the local public key. `4d29441` is the one unsigned commit. `gh auth status` still lists `write:ssh_signing_key`, as expected until the client acts. The project board is private and linked to this repo only. Lint 0 errors.

| ID | Severity | Finding | Status |
|---|---|---|---|
| 68-L1 | Low | `docs/runbooks/repo-settings.md` still says `required_signatures` is removed. A later agent could remove it to match. | fixed in #69 (Supervisor) |
| 68-L2 | Low | `docs/status.md`, `docs/phases/phase-0-plan.md`, ADR-0009 and the ADR index still say the rule is paused. | fixed in #69 (Supervisor) |
| 68-L3 | Low | Threat model row 3.4 and RR-8 still show the rule paused and #33 open. | fixed in this PR |
| 68-I1 | Info | While `write:ssh_signing_key` stays on the shared token, an agent could add a second signing key. This is the standing exposure of the pending client step (RR-8). | open client item |
| 68-I2 | Info | The PR body says `Closes #33` while the last criterion (client removes the scope) is open. The client item keeps it tracked. | accepted |
| 68-I3 | Info | The `project` scope stays on the token until the optional token step. | no action |
