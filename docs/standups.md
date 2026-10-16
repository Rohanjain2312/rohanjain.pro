# Standups

One entry at the start and end of each session (skill `session-protocol`).

## 2026-10-15 start
- Done since last time: `.claude` in place, node and gh checked, hook tests and docs lint passed, bootstrap committed locally.
- Doing now: issue #1 (bootstrap PR), then Phase 0 (repo setup, ADRs 0001 to 0012, Phase 1 backlog, threat model, design outline, probe test).
- Blockers: none.

## 2026-10-16 end
- Done: Phase 0 complete. Repo configured and protected (ruleset with signed commits, security features, interaction limit, project board). ADR-0001 to ADR-0018. Threat model, design spec outline, Phase 1 backlog (#10 to #31). Seven Medium security findings found and closed; hooks at 125 tests. Review audit, Security phase review, probe test, demo, retro, gate record.
- Next: Phase 1 in a fresh session, wave 1 (#10, #19, #30).
- Blockers: none. Client step done: 2FA, CLI permissions, signing scope removed. Optional: `brew upgrade gh`.

## 2026-10-16 start (Phase 1)
- Done since last time: Phase 0 gate passed. Removed a stale #39 worktree whose edits PR #40 had superseded.
- Doing now: Phase 1 wave 1 (#10, #19, #30) and wave 2 (#11, #22). Fixing #78 (R-110 stamp path) found while building #10.
- Blockers: none. #75 (headless probe re-run) needs a logged-in `claude` CLI, which agent shells lack.
