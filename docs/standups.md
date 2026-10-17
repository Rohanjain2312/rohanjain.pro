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

## 2026-10-16 start (Phase 1, third session)
- Done since last time: nothing new; resumed from the checkpoint in PR #130. Moved a stale Security memory file into the #107 memory branch.
- Doing now: wave 4. #14 with #42 (Platform) and #25 with #26 (App/Data) in parallel; then #15, #28, #29; then wave 5 (#31) and the Phase 1 gate. Phase 2 starts after the gate if usage allows (weekly usage at 73%).
- Blockers: none.

## 2026-10-16 end (Phase 1, third session)
- Done: #96, #118 (ADR-0022: up to eight parallel agents, haiku for chores, Low deferral rule), #15 with #150, #25 and #26, #28, #51 and #58; closed #56 and #148. Claims verification found 7 mismatches (#140 to #146).
- Next: reviews for #135, #139, #149; claim fixes; #31; Phase 1 gate. Phase 2 after the gate.
- Blockers: none. Client: three unsourced numbers in `docs/needs-client.md`; availability line; optional CLI install.

## 2026-10-17 end (Phase 1, fourth run)
- Done: #14, #42, #15 cleanup (#173, ADR-0025), #79, #147, #29, #157 (ADR-0024 ship faster), #160, #161, #140 to #146 and #151, #169, #170 (client-decided claims restored after the Supervisor's #165 error), #31 (audit 1), #177, #178, #107. Phase 1 gate passed; `v0.1.0`.
- Next: Phase 2 plan and slices.
- Blockers: none. Client: three unsourced numbers and the availability line in `docs/needs-client.md`.

## 2026-10-17 start (Phase 2)
- Done since last time: Phase 2 plan and ADR-0026 doc cleanup are in PR #185; issues #181 (PR A), #183 (PR B) and #184 created.
- Doing now: review of #185, then App/Data seeds `projects.json` and `figures.json` for PR A while Frontend starts the pages.
- Blockers: none.
