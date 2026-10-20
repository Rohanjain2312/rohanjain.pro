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

## 2026-10-18 end (Phase 2)
- Done: PR #185 plan, #186 pages and content, #187 status workflow, demo embeds, footer status, CI wiring; #189 ADR-0027; #198 shots script; #200 design gate review; #202 ADR-0028 (synthetic golden set); #199 Phase 3 plan; #206 plain-words copy pass. Status workflow ran green by manual dispatch. Phase 2 gate record written.
- Next: merge the gate PR and the memory sweep, release v0.2.0; Phase 3 PR A (#201) and PR B (#194).
- Blockers: none. Client: nothing required; optional real 5-second test packet and the other items in `docs/needs-client.md`.

## 2026-10-18 end (Phase 3)
- Done: Phase 2 closed (`v0.2.0`); Phase 3: #199 plan, #202 ADR-0028, #201 engine and tests (mutation 97.19), #206 plain-words copy, #208 fit-check UI and brief. Gate record and rating packet written.
- Next: merge the gate PR, release `v0.3.0`, Phase 3 memory sweep, start Phase 4.
- Blockers: none. Client: nothing required; optional recruiter rating packet and the 5-second test.

## 2026-10-18 end (Phase 4)
- Done: Phase 3 closed (`v0.3.0`); Phase 4: #216 plan, #217 hook exception and private repo, #218 `npm run for`, #219 résumé dialog, PDFs and `/for` pages. Gate record written.
- Next: merge the memory sweep and gate PRs, release `v0.4.0`, start Phase 6.
- Blockers: none. Client: nothing required; optional 5-second test and recruiter rating packets in `docs/needs-client.md`.

## 2026-10-19 end (Supervisor)
- Done: merged #260 to #264 (Phase 6 Low fixes), swept agent memory, wrote the Phase 6 gate record; `node scripts/phase-gate.mjs 6` passes.
- Doing: release `v0.9.0` after merge, renew the interaction limit.
- Blockers: none. The build stops until the client completes the Phase 7 steps.

## 2026-10-19 launch (Supervisor)
- Done: Phase 6 gate and `v0.9.0`; client answers recorded; Phase 7 setup (PRs #276, #280, #282, #285, #286, #288, #290); client ran the setup command and the deploy-setup command; `v0.9.1` published; first deploy green. Live checks: 200 on apex, `www` and `*.pages.dev`; HSTS and CSP present; no `Set-Cookie`; DNSSEC validates; three résumé PDFs 200.
- Doing: launch checks (runbook section 7), beacon check, `v1.0.0`.
- Blockers: none.

## 2026-10-19 end (Supervisor)
- Done: Phase 7. Live site on `v1.0.1`; found and fixed the Cloudflare email rewriting (PRs #297, #299); privacy copy (#288); ADR-0034 and ADR-0035; lint cleanup (#301); cross-browser matrix run; Phase 7 gate record and memory sweep.
- Doing: Phase 8 is next; nothing needs the client.
- Blockers: none.
