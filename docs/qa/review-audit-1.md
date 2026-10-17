# Phase 1 review audit

Owner: qa-engineer. Rule: R-206 (skill `phase-gate`, step 2). Issue: #107 (the PR cites it as directed; the issue itself is the agent-memory sweep). Audit date: 2026-10-16 (local; PR timestamps below are UTC and run to 2026-10-17T04:55Z). Main at audit: `22d3563`.

## Limit

Subagent transcripts were not available to QA for this audit. Phase 0 matched each approval to the reviewer's transcript. Phase 1 cannot. What this audit checks is everything visible on GitHub and in git: the comment fields, the Head against the final PR head, the label events against the reviews, the required reviews against the changed paths, and a re-run of a few factual claims from the review text. Whether a reviewer really ran the commands it lists is not verified. Whether a reviewer was a different instance from the builder rests on the `Agent:` field only.

## Population and method

Phase 1 population: the 34 PRs merged after the Phase 0 gate record (#73, 2026-10-16T07:46:58Z) up to and including #172: #77, #81, #82, #83, #84, #85, #89, #94, #106, #108, #109, #110, #113, #117, #119, #120, #122, #124, #125, #130, #132, #133, #134, #135, #136, #137, #138, #139, #149, #152, #158, #165, #168, #172.

Only 21 of these carry the `phase-1` label. The 13 merged between 08:08Z and 19:04Z on 2026-10-16 (#77 to #113) carry no phase label. A `phase-1` label search misses them, so the population was taken by merge order, not by label.

Required sample: 20% of 34 is 6.8, so 7 PRs, with at least one CHANGES REQUESTED round.

CHANGES REQUESTED set, taken from the PR comments (not from a brief): #84, #106, #119, #120, #122, #124, #125, #133, #134, #135, #136, #158 (12 PRs).

Draw: Python `random.Random(20261016)` (the audit date, as in audit 0). One PR with `choice` from the CR set, then six with `sample` from the other 22.

Result: #119 (CR set); #110, #132, #137, #139, #149, #172 (rest). Sample size 7 of 34 (20.6%).

Evidence: `gh api repos/Rohanjain2312/rohanjain.pro/issues/<n>/comments`, `.../issues/<n>/events`, `gh pr view <n> --json headRefOid,commits,files,additions`, `git show <sha>:<path>` on the reviewed heads, and `.github/labeler.json` at main for the path map.

## Whole-population screen

A script checked all 34 PRs: every review comment has `REVIEW`, `Reviewer`, `Head`, `Agent`, `Checked` and `Findings`; every `Head` that carries an approval equals the final PR head; every `approved:<role>` label has an approving review at the final head; every "no findings" review lists at least three checks; no commit follows the last approval. Exceptions found:

| Exception | PRs |
|---|---|
| Supervisor review at the final head, but no `approved:supervisor` label | #132, #133, #134, #136, #137, #138, #139, #149, #152, #158 |
| `Agent:` holds a role name, not an agent id | #149 (Security review) |

`approved:supervisor` was required by the skill `run-review` from the start. The review-gate (#135, merged 04:26Z) enforces it, and every PR after it has the label. #138 had no review beyond the Supervisor's and no `needs:*` label.

## Sampled PRs

Final heads and review times are UTC, 2026-10-16 unless dated.

### #119 feat(content): claims, skills, roles and site data (#23)

Builder: app-data-engineer. Final head `0e4b1b44fbee`, merged 19:36:15Z. Implied by `labeler.json`: `needs:qa-review`.

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 19:27:33 | CHANGES REQUESTED | qa-engineer | e4ef9e04d73a | a63a92d4ccf6e25f8 |
| 2 | 19:34:53 | APPROVED | qa-engineer | 0e4b1b44fbee | a9feb2940bdd005e0 |
| 3 | 19:36:11 | APPROVED | supervisor | 0e4b1b44fbee | supervisor (main session) |

Commits: e4ef9e0 19:24:06, 0e4b1b4 19:28:20. Labels: `phase-1`, `needs:qa-review` 19:24:44; `approved:qa` 19:34:57; `approved:supervisor` 19:36:12.

| Check | Result | Evidence |
|---|---|---|
| Fields (R-202) | Pass | All present in all three. |
| Head (R-208) | Pass | CR on the first head; the fix commit came 19:28:20; the approval names the new head and follows it. |
| Labels match reviews | Pass | Each label follows its review by 1 to 4 seconds. |
| Required reviews (R-209) | Pass | Only `src/content/**` changed. QA reviewed. |
| Claims in the reviews re-run | Pass | At the final head: 300 skills (192 shipped, 33 work, 75 studied), 100 aliases on 62 skills, 92 claims with 92 unique ids. At the first head: 105 aliases on 67 skills and the five flagged aliases (`spark`, `embedding`, `torch`, `mistral`, `time series forecasting`) present; none at the final head. The Supervisor's "current main 826abb6, PR #120" is the #120 merge commit. |

### #110 feat(qa): copy lint (#27)

Builder: qa-engineer. Final head `044337a80266`, merged 18:52:46Z. Implied: `needs:security-review` (`package.json`), `needs:qa-review` (`tests/**`).

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 18:52:42 | APPROVED | supervisor | 044337a80266 | supervisor (main session) |

Labels: `approved:supervisor`, `size:approved` 18:52:43.

| Check | Result | Evidence |
|---|---|---|
| Fields, Head, labels | Pass | One commit at 18:50:14; review names it. |
| Required reviews (R-209) | Fail (minor) | The only review is the Supervisor's. By today's path map the PR needs Security and QA. The labeler did not exist (#135 merged 04:26Z on the 17th), so no label was set and nobody requested them. The `package.json` change is one added script (`lint:copy`); no dependency changed. |
| Claims in the review re-run | Pass | 19 files and 809 additions match `gh pr view 110`. The commit exists. The command list is specific (test count, build then `lint:copy --require-dist`, an independent printf probe). |

### #132 docs(status): Phase 1 third-session checkpoint (#131)

Builder: supervisor. Final head `2ebd8fe17c46`, merged 2026-10-17T00:55:28Z. Implied: none (3 docs files).

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 00:55:25 (17th) | APPROVED | supervisor | 2ebd8fe17c46 | main |

| Check | Result | Evidence |
|---|---|---|
| Fields, Head | Pass | Four commits at 00:53:49, review names the last. |
| Labels | Fail (minor) | No `approved:supervisor` event. Only `phase-1`, `role:supervisor`, `type:docs`, added 00:55:13 to 00:55:14. |
| R-207 | Pass | "none" findings, three checks listed (`npm run verify` stamp, `lint-docs`, CI and merge state). |
| Self-review | Note | The Supervisor built the PR and wrote the only review. No other review is required for docs. The review was posted 3 seconds before the merge. |

### #137 feat(content): resume.json and claims check (#25)

Builder: app-data-engineer. Final head `fd1148cdaee2`, merged 2026-10-17T00:39:15Z. Implied: `needs:security-review` (`package.json`), `needs:qa-review`.

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 00:35:57 (17th) | APPROVED | qa-engineer | fd1148cdaee2 | a17b5aacafca11a65 |
| 2 | 00:39:12 (17th) | APPROVED | supervisor | fd1148cdaee2 | main |

Commits: a26fcaf 00:28:20, fd1148c 00:29:47. Labels: `needs:qa-review` 00:30:57; `approved:qa` 00:35:58. No `approved:supervisor`.

| Check | Result | Evidence |
|---|---|---|
| Fields, Head, `approved:qa` | Pass | |
| Required reviews (R-209) | Fail (minor) | `package.json` changed: `build` now ends with `node scripts/check-claims.ts --require-dist` and a `check:claims` script was added. Security was never requested. The change adds no dependency. |
| `approved:supervisor` | Fail (minor) | Missing (see screen). |
| Agent id reuse | Note | The id `a17b5aacafca11a65` also posted both QA reviews on #152, a QA-authored PR. Whether that agent built #152 is not verifiable without transcripts. |

### #139 test(e2e): headers and inline-code test (#29)

Builder: qa-engineer. Final head `1b91d85dcee9`, merged 2026-10-17T01:05:37Z. Implied: `needs:qa-review`.

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 01:05:14 (17th) | APPROVED | qa-engineer | 1b91d85dcee9 | ad0c01c879b73e4be |
| 2 | 01:05:34 (17th) | APPROVED | supervisor | 1b91d85dcee9 | main |

| Check | Result | Evidence |
|---|---|---|
| Fields, Head, `approved:qa` | Pass | One commit, 00:31:58. |
| `approved:supervisor` | Fail (minor) | Missing. |
| Reviewer independent of builder | Not verified | A QA instance reviewed a QA-built PR. The Supervisor review says "a separate QA instance from the builder". The agent ids cannot be compared with the builder's without transcripts. |

### #149 fix(deps): enforce 7-day release cooldown on manual npm installs (#79)

Builder: platform-engineer. Final head `f6f003b415e8`, merged 2026-10-17T01:01:39Z. Implied: `needs:security-review`.

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 01:01:07 (17th) | APPROVED | security-engineer | f6f003b415e8 | security-engineer |
| 2 | 01:01:34 (17th) | APPROVED | supervisor | f6f003b415e8 | main |

| Check | Result | Evidence |
|---|---|---|
| Agent field (R-202) | Fail (minor) | The Security review has `Agent: security-engineer`, a role name and no agent id. It cannot be matched to a transcript (R-206). |
| `approved:supervisor` | Fail (minor) | Missing. |
| Head, `approved:security` | Pass | Two commits (00:58:33, 00:58:44); review follows; label 1 second later. |
| Claims in the review re-run | Pass | 4 files, +37 -0, as stated. `.npmrc` at the head holds `ignore-scripts=true` and `min-release-age=7`. `package.json` and the lock are not in the file list. |

### #172 fix(content): restore client-decided claim values (#169)

Builder: app-data-engineer, plus one QA-authored commit (`eda3829`, `docs/qa/claims-verification.md`, trailer `Agent-Role: qa-engineer`). Final head `eda3829913e2`, merged 2026-10-17T04:54:58Z. Implied: `needs:qa-review`.

| # | Posted | Verdict | Reviewer | Head | Agent |
|---|---|---|---|---|---|
| 1 | 04:53:28 (17th) | APPROVED | qa-engineer | eda3829913e2 | a77265f008ec2a20f |
| 2 | 04:54:13 (17th) | APPROVED | supervisor | eda3829913e2 | main |

Labels: `needs:qa-review` 04:48:05; `approved:qa` 04:53:29; `approved:supervisor` 04:54:13.

| Check | Result | Evidence |
|---|---|---|
| Fields, Head, labels, required reviews | Pass | The last commit 04:50:12 precedes both approvals. |
| Claims in the review re-run | Pass | Compared `claims.json` at the head with `595c0bb`: 92 claims in both. Fields that differ are exactly `note` on eight claims (goldman-tenure, goldman-tenure-years, loan-v2-subgraphs, loan-v2-deploy, fc-pruning-heads, fc-pruning-f1-gain, mr-baselines, mr-f1), `display` on `tariff-rulings-eval`, and `value` and `display` on `tariff-dates`. This is the QA review's list. `resume.json` is identical. |
| Reviewer independent of the QA commit | Not verified | The review says the reviewer is a separate QA instance from the log author; the ids are not comparable without transcripts. |

## Summary

| PR | Reviews | Fields | Head | Labels match reviews | `approved:supervisor` | Required reviews present | Review claims re-run |
|---|---|---|---|---|---|---|---|
| #119 | 3 (QA x2, Supervisor) | Pass | Pass | Pass | Pass | Pass | Pass |
| #110 | 1 (Supervisor) | Pass | Pass | Pass | Pass | Fail (minor) | Pass |
| #132 | 1 (Supervisor) | Pass | Pass | Pass | Fail (minor) | Pass | n/a |
| #137 | 2 (QA, Supervisor) | Pass | Pass | Pass | Fail (minor) | Fail (minor) | Not run |
| #139 | 2 (QA, Supervisor) | Pass | Pass | Pass | Fail (minor) | Pass | Not run |
| #149 | 2 (Security, Supervisor) | Fail (minor) | Pass | Pass | Fail (minor) | Pass | Pass |
| #172 | 2 (QA, Supervisor) | Pass | Pass | Pass | Pass | Pass | Pass |

No sampled approval was posted against a stale head. No `approved:<role>` label lacks a review. No Supervisor review was posted under another role. Every factual claim that could be re-run from git or GitHub held (#119, #110, #149, #172). Not verified: that any reviewer ran the commands it lists; the independence of QA reviewers on QA-built work (#139, #172); the 27 PRs outside the sample.

## Process issues

1. **Missing `approved:supervisor` label (10 of 34 PRs, #132 to #158).** The skill requires it; nothing enforced it until the review-gate landed in #135. All later PRs have it. No action beyond noting that the gate now covers it.
2. **Review requirements were unlabeled before the labeler (#135).** #110 and #137 changed `package.json` and tests with no Security review and, for #110, no QA review. Both package.json changes only add scripts. Suggested action: Security reads those two `package.json` diffs at the gate and records the result, or the Supervisor accepts the gap in an ADR note.
3. **Role name in the `Agent:` field (#149).** The guard-bash hook checks `Reviewer` against the agent type, not that `Agent` is an id. Suggested fix: the review-gate rejects an `Agent:` that is not an id, except `main` and `supervisor (main session)`.
4. **No phase label on 13 PRs.** `label:phase-1` returns 21 of 34. The phase-gate script counts must not rely on the label alone for #77 to #113.
5. **Transcripts.** Phase 1 audit rests on GitHub and git only. If the transcripts matter at the gate, the Supervisor should supply their paths for a follow-up pass on the same seven PRs.
6. **Supervisor reviews now carry evidence.** In the Phase 0 audit they listed no commands. In this sample every Supervisor review names commands it ran, so the Phase 0 process issue 1 is closed for these PRs.
7. **Shared account.** As in Phase 0, all comments and labels are by `Rohanjain2312`; role rests on the `Reviewer:` and `Agent:` fields.
