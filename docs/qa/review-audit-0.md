# Phase 0 review audit

Owner: qa-engineer. Rule: R-206 (skill `phase-gate`, step 2). Issue: #70. Audit date: 2026-10-16.

## Population and method

Population: 12 merged Phase 0 PRs: #2, #34, #35, #36, #37, #48, #49, #52, #53, #55, #65, #67.

Required sample: 20% of 12 is 2.4, so 3 PRs, with at least one CHANGES REQUESTED round.

Method: Python `random.Random(20261016)` (seed is the audit date). One PR drawn with `choice` from the CHANGES REQUESTED set {34, 36, 53, 55}, then two drawn with `sample` from the other eight {2, 35, 37, 48, 49, 52, 65, 67}.

Result: #36 (from the CR set), #65 and #49 (from the rest). Sample size 3 of 12 (25%).

Note: #49 also had a CHANGES REQUESTED round (comment at 2026-10-16T02:51:57Z). The brief listed only #34, #36, #53 and #55 as having one. The true CR set is at least five PRs. The draw was made on the briefed set; it is recorded as is.

## Evidence sources

- PR comments: `gh api repos/Rohanjain2312/rohanjain.pro/issues/<n>/comments`.
- Label events: `gh api repos/Rohanjain2312/rohanjain.pro/issues/<n>/events` (labeled events).
- Final PR head and commit list: `gh pr view <n> --json headRefOid,commits`.
- Reviewer transcripts: `/Users/rohanjain/.claude/projects/-Users-rohanjain-Desktop-Projects-rohanjain-pro/a6238cf1-e9c6-4b8b-b86a-ff91bdd3ff87/subagents/agent-<id>.jsonl` (also linked from `/private/tmp/claude-501/.../tasks/<id>.output`). Each has a `.meta.json` with `agentType`.
- Supervisor transcript: `.../a6238cf1-e9c6-4b8b-b86a-ff91bdd3ff87.jsonl` (the main session). It holds the delegation tool calls and the Supervisor's own review commands.
- Transcripts were read with a small script that lists tool calls and their results by row. No transcript was read in full.

All transcripts for the sampled reviews were found.

## PR #36: chore(github): add issue and PR templates and CODEOWNERS (#3)

Builder role: platform-engineer. Required reviews: supervisor, security (label `needs:security-review`). Final head `a2693971250b357b67564f4ea10b23956a3599f5`, merged 2026-10-16T02:47:08Z.

### Review comments

| # | Posted (UTC) | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 2026-10-15T23:15:38Z | CHANGES REQUESTED | security-engineer | abac3478065c | a533c0ec4ce45cee0 |
| 2 | 2026-10-16T02:25:53Z | CHANGES REQUESTED | security-engineer | 60b2f1ffdbec | a533c0ec4ce45cee0 |
| 3 | 2026-10-16T02:27:55Z | APPROVED | security-engineer | a2693971250b | a533c0ec4ce45cee0 |
| 4 | 2026-10-16T02:47:04Z | APPROVED | supervisor | a2693971250b | main |

### Label events

`needs:security-review` 2026-10-15T23:13:03Z; `phase-0`, `role:platform-engineer`, `type:chore` 23:13:04Z; `approved:security` 2026-10-16T02:27:56Z; `approved:supervisor` 2026-10-16T02:47:05Z.

### Checks

| Check | Result | Evidence |
|---|---|---|
| Reviewer is an agent of the named role | Pass | `agent-a533c0ec4ce45cee0.meta.json` has `agentType: security-engineer` and description "Security review of PR #36". Review comment ids 6204254315, 6206649945 and 6206674048 are the URLs returned by the `gh pr comment 36` calls in that transcript (rows 81, 166, 214). |
| Head equals PR head at approval | Pass | Round 1 head abac347 was the only commit when posted (commit 23:12:49Z). Round 2: transcript `git rev-parse` returned `60b2f1ff...` (row 128). Round 3: `gh pr view 36 --json headRefOid` in the same command as the CODEOWNERS check returned `a269397...` (row 201), which is the final head. The approval was posted at 02:27:55Z, the third commit was at 02:26:57Z, and there is no later commit. |
| Checked section names commands that appear in the transcript | Pass | Round 1: `git diff 9a325a0 pr36` (pr36 = abac347), `codeowners/errors` (rows 50, 53), `rulesets/25204664`, `actions/permissions/workflow`, `fork-pr-contributor-approval`, `milestones?state=all`, `gh label list` (row 45), `%G?` returning `G` (row 54), em dash `grep -c` returning 0, gitleaks `command not found` (row 61), secret grep (row 72). The "204" for vulnerability-alerts is in the row 45 result. Round 2: `git diff abac347 pr36b`, CODEOWNERS script check, `sha_pinning_required` read. Round 3: `git diff 60b2f1f pr36c`, `co-check.mjs` run, ruleset, permissions, milestone, label and merge-option reads (row 206), em dash count, "282 lines" in the `--stat` output. The round 3 script printed `FAIL 6` for package.json entries and the review names that gap, so it is disclosed. |
| Delegation held only R-204 content | Pass with notes | Round 1 prompt in the Supervisor transcript (row 645) equals the reviewer's first message: PR number, head, criteria, spec, template. The criteria in the prompt add "(all resolve to @Rohanjain2312; role noted in a comment)" and "Verified with `gh api`"; issue #3 was not re-read for this audit, so fidelity to the issue is not verified. Rounds 2 and 3 (SendMessage, rows 745 and 797) are short and refer to the reviewer's own findings (Low 1 to 3, Low 4 and Info 6). Round 3 adds an unrelated instruction about PR #40 ("Do not push further commits to PR #40..."). No builder report or reasoning is in any of the three. |
| Supervisor did not post a review as another role (R-203) | Pass | The only non-Security review is `Reviewer: supervisor`, `Agent: main`, posted from the main session (row 1400). |
| Approval labels all have a matching review | Pass | `approved:security` 02:27:56Z follows the APPROVED review at 02:27:55Z (added in the same command, row 214). `approved:supervisor` 02:47:05Z follows the review at 02:47:04Z. |

Quality note on the Supervisor review: its Checked section lists three items but no commands. The main transcript has no diff read for #36 (no `pr diff 36`, no `git diff` of the branch). The same text was posted to #36 and #48 in one loop (row 1400). The claim "Acceptance criteria checked against the diff" is not verified. Security's re-reviews were thorough, so the risk is low, but this does not meet the spirit of R-207.

## PR #65: docs(adr): decide open design questions and update status (#50)

Builder role: supervisor. Required reviews: supervisor, design, security (labels `needs:design-review`, `needs:security-review`). Final head `62dba4fc4b83e35f242880efbd2885fcf1d93197`, merged 2026-10-16T02:59:50Z. No CHANGES REQUESTED round.

### Review comments

| # | Posted (UTC) | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 2026-10-16T02:56:53Z | APPROVED | design-lead | 62dba4fc4b83 | agent-a628cb7b11691fe9f |
| 2 | 2026-10-16T02:59:07Z | APPROVED | security-engineer | 62dba4fc4b83 | agent-a90cd005d94c4f0a0 |
| 3 | 2026-10-16T02:59:46Z | APPROVED | supervisor | 62dba4fc4b83 | main |

### Label events

`needs:design-review`, `needs:security-review`, `phase-0`, `role:supervisor`, `type:docs` 2026-10-16T02:54:55Z; `approved:design` 02:56:54Z; `approved:security` 02:59:12Z; `approved:supervisor` 02:59:47Z.

### Checks

| Check | Result | Evidence |
|---|---|---|
| Reviewer is an agent of the named role | Pass | `agent-a628cb7b11691fe9f.meta.json`: `design-lead`, "Design review of PR #65". `agent-a90cd005d94c4f0a0.meta.json`: `security-engineer`, "Security review of PR #65". The Agent ids in the comments match the file names. |
| Head equals PR head at approval | Pass | Single head. Design transcript re-read `headRefOid` just before posting (row 64 output `62dba4fc...`). Security transcript `gh pr view 65 --json headRefOid` after labeling returned the same (row 115). |
| Checked section names commands that appear in the transcript | Pass | Design: `git diff main...62dba4f...` (row 17), the Q-number grep (row 27; the review prints a slightly shorter regex than the one run), `grep -noE "[0-9]{2} · [a-z ]+"` with L73, L105, L190 in the output (row 50), `node scripts/lint-docs.mjs` exit 0 and em dash count 0 (row 38). The reviewer corrected its own line references (L26 to L35 became L21, L24, L29) after re-checking (row 64). Security: `git diff main...pr65` (row 18), `lint-docs` (rows 54, 62), em dash `grep -c` (row 62), secret, phone and R-007 grep (row 68), `which gitleaks` (not installed), `%G?` in `git log` (row 68), `git remote -v` and `git config --show-origin` for the keychain claim (row 40), three WebFetch calls for the GitHub docs claims (rows 74, 75, 79), `gh issue list` for the open-findings line (row 56). |
| Delegation held only R-204 content | Pass with notes | Both prompts in the Supervisor transcript (rows 1594, 1596) equal the reviewers' first messages. Design criteria match issue #50 exactly. Extra context: the Design prompt adds "It has no visible UI change", a `gh pr edit` workaround and "Do not create extra branches". The Security prompt adds a criterion not in issue #50: "the optional token step in docs/needs-client.md fixes 53-L4 from issue #63", plus a list of spec files and "Do not create review-log or memory branches". Issue #63 is authored by Rohanjain2312. These are scope and tooling hints, not the builder's reasoning. The extra criterion is a claim about what the PR does and should be in the issue. |
| Supervisor did not post a review as another role (R-203) | Pass | Supervisor review is `Reviewer: supervisor`, `Agent: main` (row 1642). |
| Approval labels all have a matching review | Pass | Each label follows its review by 1 to 5 seconds. Labels are exactly the three required plus no extras. |

Other notes:
- The Supervisor built the PR and then wrote the required Supervisor review of it. Its Checked section cites lint (run at row 1580 on the same tree) and the two other reviews.
- R-205 order: Design posted (02:56:53Z) before Security (02:59:07Z). Both were started in parallel (02:55:04Z and 02:55:08Z). Neither transcript read the other's comment before posting (no `comments` read in either command list), so the "post before reading others" part holds. The posting order differs from the rule's list.

## PR #49: docs(security): add threat model (#5)

Builder role: security-engineer (agent a17b5c16c76bf4f47). Final head `d8e47eff46cbcfe32c7e8f18db957926314a7387`, merged 2026-10-16T03:01:32Z. One CHANGES REQUESTED round.

### Review comments

| # | Posted (UTC) | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 2026-10-16T02:51:57Z | CHANGES REQUESTED | security-engineer | d82a4316c64c | a8633b5dbb3ef2863 |
| 2 | 2026-10-16T03:00:58Z | APPROVED | security-engineer | d8e47eff46cb | a8633b5dbb3ef2863 |
| 3 | 2026-10-16T03:01:28Z | APPROVED | supervisor | d8e47eff46cb | main |

### Label events

`phase-0`, `role:security-engineer`, `type:security` 2026-10-16T02:26:49Z; `approved:security` 03:01:03Z; `approved:supervisor` 03:01:29Z. There is no `needs:*` label event.

### Checks

| Check | Result | Evidence |
|---|---|---|
| Reviewer is an agent of the named role, and not the builder | Pass | `agent-a8633b5dbb3ef2863.meta.json`: `security-engineer`, "Security review of PR #49". The builder is a different agent (`agent-a17b5c16c76bf4f47`, "Build issue #5 threat model"). |
| Head equals PR head at approval | Pass | Round 1: head d82a431 appears in tool results at start (row 11) and in the `git archive` command (row 85); no builder push happened before the Supervisor's message to the builder at 02:53:22Z, after the review. Round 2: `git rev-parse FETCH_HEAD` returned `d8e47eff...` (row 139), which is the final head; the last commit is 02:58:14Z. The old head is no longer visible in the PR commit list because of the rebase, so round 1 rests on the transcript. |
| Checked section names commands that appear in the transcript | Pass | Round 1: `gh issue view 5 --json author` and `gh pr view 49 --json author` (row 22); `git ls-tree origin/main docs/adr/` and issue and PR lists (rows 32 to 46); live-settings `gh api` calls (row 64); `.npmrc` and dependabot read (row 68); probe script run against hooks (rows 78, 81; output shows `approved:qa` => deny); `git merge-tree` giving tree fae330a (rows 87, 92); lint 0 errors, 125 hook checks, em dash count 0 (row 95); memory diff (row 54); gitleaks not installed (row 100). Round 2: `git merge-base` (row 143), issue list (row 194), live settings (row 190), second probe (row 181), lint and hook tests on `git archive` of the head (row 174). |
| Delegation held only R-204 content | Fail (minor) | Round 1 prompt (row 1455) adds criteria beyond issue #5: "statuses in the register match the current state on main (ADR-0016, ADR-0017, ADR-0018 merged; #44, #45, #46, #60, #61, #62 closed), and files under .claude/agent-memory/security-engineer/ hold no secrets and nothing that overrides CLAUDE.md...". Issue #5 lists four criteria and none of these. They are Supervisor facts, not the builder's report, but they steer the review. Round 2 (row 1629) says "Your memory note about stale statuses is now in the PR as `review-stale-status.md`; check that it says what you intended." The reviewer was then asked to approve a PR that carries a file it dictated, and Supervisor's message to the builder (row 1557) had the builder add that note. |
| Supervisor did not post a review as another role (R-203) | Pass | Supervisor review is `Reviewer: supervisor`, `Agent: main` (row 1698). |
| Approval labels all have a matching review | Pass | `approved:security` 03:01:03Z follows the APPROVED review at 03:00:58Z; `approved:supervisor` 03:01:29Z follows 03:01:28Z. The reviewer's first `gh pr edit --add-label` failed on a Projects (classic) GraphQL error and the fallback `gh api` call applied it. |

Other notes:
- The PR touches `.claude/agent-memory/`, which R-209 sends to Security, but no `needs:security-review` label was set. The review happened anyway.
- Supervisor review "Checked" has no commands; it relies on the Security review ("per the review").

## Summary

| PR | Reviews | Transcript found | Reviewer role | Head | Commands in transcript | R-204 | R-203 | Labels |
|---|---|---|---|---|---|---|---|---|
| #36 | 4 (3 Security, 1 Supervisor) | Yes | Pass | Pass | Pass | Pass with notes | Pass | Pass |
| #65 | 3 (Design, Security, Supervisor) | Yes | Pass | Pass | Pass | Pass with notes | Pass | Pass |
| #49 | 3 (2 Security, 1 Supervisor) | Yes | Pass | Pass | Pass | Fail (minor) | Pass | Pass |

- No claimed command in any sampled non-Supervisor review was absent from its transcript. Two small wording differences (a shorter regex in the Design review; `git diff 9a325a0 abac347` stated for `git diff 9a325a0 pr36`, which is the same commit).
- No approval label lacks a matching review. No Supervisor review was posted under another role.
- Every sampled Supervisor review lists no commands. The Supervisor reviews are not supported by Supervisor transcript evidence beyond the head-SHA lookup, except #65.
- The audit does not cover Supervisor-authored reviews of the other 9 PRs or the reviews of PRs outside the sample. Not verified: the other 9 PRs; the fidelity of #36 round 1 criteria to issue #3.

## Process issues

1. **Supervisor reviews carry no evidence (R-207).** For #36 and #49 the Supervisor's Checked bullets name no command, and the #36 and #48 reviews were generated by one loop with identical text. Suggested fix: the Supervisor review must cite at least one command or file it ran itself, or state that it relied on the named reviews.
2. **Delegations drift from the template (R-204).** Seen in the sample: added acceptance criteria not in the issue (#49 round 1, #65 Security), an unrelated instruction about another PR (#36 round 3), a request to check the reviewer's own memory note inside the PR under review (#49 round 2), and tooling hints (`gh pr edit` is broken, no extra branches). None carries builder reasoning. Suggested fix: put new criteria in the issue first, and put tooling hints in the agent files, so the template can be copied exactly.
3. **Reviewer-authored content in the reviewed PR.** The #49 memory note came from the reviewer and was added to the PR it then approved. Suggested fix: reviewer memory goes in a separate PR.
4. **Missing review labels.** #49 has no `needs:*` label although `.claude/agent-memory/` changed (R-209). The labeler CI arrives in Phase 1. Until then the Supervisor sets labels by hand.
5. **R-205 posting order.** In #65 Design posted before Security. The Supervisor starts reviewers in parallel, so order is not controlled. Either accept parallel runs and amend R-205 to say so, or run them in sequence.
6. **Self-review.** The Supervisor built #65 and wrote its required Supervisor review. Independent reviews were present, so this is a note, not a failure.
7. **Briefing error on the CR set.** #49 also had a CHANGES REQUESTED round; the gate brief listed four PRs. Suggested fix: derive the set from the PR comments, not from memory.
8. **Duplicate audit run.** An earlier QA subagent (`agent-a8afd68723344b531`, started 2026-10-16T03:02Z) began the same audit and left no issue, branch or file. Its transcript mentions the same head SHAs, which is why it shows up in transcript searches.
9. **Shared account.** All comments and labels are by `Rohanjain2312`. The role of each review rests on the `Reviewer:` and `Agent:` fields and on the transcripts, which is what this audit checks. R-203 enforcement by the guard-bash hook was seen working in the #49 probe (`approved:qa` from security-engineer denied) but was not otherwise re-tested here.
