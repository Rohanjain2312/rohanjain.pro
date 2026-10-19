---
name: pr261-phase6-text-lows
description: PR #261 (Supervisor, issue #244 Phase 6 text Lows, ADR-0033) CHANGES REQUESTED at d61ea84 for two ticked boxes; recheck list for the next head.
metadata:
  type: project
---

PR #261 closes issue #244 (25 boxes: ticked or struck) and adds ADR-0033 (client values override repo values), with the status-data ruleset 25363273 created by the client's OK.

Round 1 (head d61ea848562844d64e8d98da2dbc7a66448317b7): CHANGES REQUESTED, comment posted on the PR. Lows logged on #233 in one comment.

Round 2 (same head, 2026-10-19): APPROVED after the coordinator struck 215-q (not done, Phase 6 gate sweep, status step 5) and 163-af (browsers:install only, rest logged on #233). Label approved:qa added. Open Low: 163-af strike says "deferred to Phase 8", which no tracker records.

What passed: lint-docs (87 rules, 0 errors); ruleset 25363273 active on `refs/heads/status-data` with deletion and non_fast_forward and no bypass; release-please branch gone; ADR index complete (33 and 33); ADR-0033 skill and résumé claims agree (Docker, Kubernetes, Docker images, Dockerfiles, Deployments, Deployment automation, A2A protocols at shipped with ["loan"], matching résumé lines 28 to 31); strike 163-p holds on the lines checked.

What blocked (Medium):
- 215-q ticked "done" for the memory sweep. Six QA memory files sit only in five worktrees (feedback-probe-bypass-forms-exactly.md, feedback-exemption-premise-check.md, project-pr257-status-handoff-review.md, feedback-sweep-content-loss.md, project-pr254-production-deploy-template.md, project-guard-bash-probe-pr237.md). `docs/status.md` "Interrupted work" still says copy before removing.
- 163-af ticked "partly done": no ADR for the plain-file fallback (R-004); no first-click clause in spec 01 criterion 9 or the Phase 6 repeat in spec 11; skill still says the Phase 3 packet includes the résumé PDF and gives "cannot be asked of a static screenshot" as the reason.

Lows (on #233 from this review): ADR-0033 Context wording (no older repo value in R-302, R-306 or spec 01 row 8); release-please text in spec 03 and 10 and owners.json; golden-set RA verdict step against R-210; hook exception #214 missing from ADR-0026 and threat-model 1.9; status Open PRs stale and #242 open after the ruleset; client asked to run `npm run shots`; CONTRIBUTING "Supervisor reviews every pull request"; 163-r line numbers 324 and 326 beyond the 41-line needs-client file.

**Recheck at the next head:** the six memory files are in main; 163-af's four parts are done or struck with a real tracker item; `docs/status.md` Open PRs matches `gh pr list --state open`; the ADR-0033 Context matches the rows it cites.

**Why:** a ticked box that is only partly done, or a tick on a future-tense plan, is a false closure. The brief says "fixed, or struck with a one-line reason", so a partial tick fails it.
**How to apply:** see [[feedback-tracker-pointer-and-tick-evidence]] and [[docs-review-checks]].
