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

## 2026-10-16 end (Phase 1)
- Done: #10 scaffold, #19 design spec, #30 README/CONTRIBUTING/LICENSE (ADR-0019), #11 lint gates, #22 content schemas, #20 tokens, #27 copy lint, #12 git hooks. Process fixes: #78 (R-110 stamp path), #104 (Stop hook lets subagents leave memory uncommitted), #87 (JSON-LD exemption), #93 (memory consolidation).
- Next: #17, then wave 3 (#13, #16, #18, #21, #23, #24).
- Blockers: none. Client: nothing required. Optional: `brew upgrade gh`.

## 2026-10-16 start (Phase 1, second session)
- Done since last time: nothing new; resumed from the checkpoint in PR #113.
- Doing now: speed-ups from the client (sonnet reviewers, parallel reviews: ADR-0020, #115), then #17 and wave 3.
- Blockers: none.

## 2026-10-16 end (Phase 1, second session)
- Done: #115 (sonnet reviewers, parallel review order), #17 preview header emulation, #23 and #24 content data, #18 headers and CSP, #21 base styles and fonts, #13 and #16 CI and phase gate script (ADR-0021 waives one dev-only OSV advisory until 2027-01-15). CI now runs on every PR.
- Next: wave 4, starting with #14.
- Blockers: none. Client: confirm the availability text; optional CLI install for autopilot (#116); optional `brew upgrade gh`.
