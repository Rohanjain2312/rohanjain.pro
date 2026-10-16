# Phase 0 retrospective

## Went well
- Security reviews caught real problems before any site code existed: seven Medium findings (#9, #44, #45, #46, #60, #61, #62), all closed, including a design that would have exposed every job application in the public repo (ADR-0016).
- Hook tests grew from 54 to 125 and every review finding became a test case.
- Independent reviewer instances caught each other's misses (PR #36 Low 4, PR #34 S34-1, PR #49 stale statuses).
- The client-only steps stayed short; the client finished 2FA and the CLI permissions within a day.

## Went badly
- **Usage.** Two usage-limit stops. Every subagent defaulted to opus, and several hit their turn limit and had to be resumed. From now on the Supervisor sets the model per task (haiku or sonnet for mechanical work, opus only for hook and security code).
- **Supervisor review evidence (review audit, finding 1).** Supervisor reviews on #36 and #48 listed no commands, and one loop posted the same text on both. R-207 asks for named checks with evidence.
- **Delegation drift (review audit, finding 2).** Some review delegations added criteria or instructions beyond the issue (#49, #65, #36 round 3). None carried builder reasoning, but R-204 says to copy the template exactly.
- **Review order (finding 4).** On #65 Design and Security ran in parallel; R-205 sets an order.
- **Labels (finding 3).** #49 changed `.claude/agent-memory/` without `needs:security-review`. Until the labeler (#14) exists, the Supervisor labels by hand and missed one.
- **Self-review (finding 5).** The Supervisor builds its own docs PRs and writes their Supervisor review; Security or Design reviewed each, but the Supervisor approval adds little.
- **Live hooks followed the main checkout's branch.** While the main checkout sat on feature branches, agents ran older hooks and older path ownership (memory writes denied, #57). The main checkout now stays on `main`.
- **Agent memory scattered across worktree branches** (draft PRs #40, #59, #64, scratchpad files) until one consolidation PR.
- **Stale wording after a control changed** (PR #68 review): five files still said the signed-commit rule was paused.

## One process change
**Reviews follow the run-review skill to the letter.** Delegations copy the template with the issue's criteria only; any extra point goes in a separate line marked "Supervisor note" and is listed in the PR body. Reviews run in R-205 order, not in parallel. Supervisor reviews name the exact commands run and their result. The Supervisor labels every PR touching `.claude/**`, `.github/**`, `.npmrc` or dependencies with `needs:security-review` until #14 automates it.

## Context audit
Source: `.claude/state/hook-log.jsonl` (34 denials) and the Phase 0 review audit (`docs/qa/review-audit-0.md`).

| Rule | Denials | Roles | Reading |
|---|---|---|---|
| R-112 | 8 | security-engineer | Memory writes denied while the live hooks lacked memory ownership (fixed by PR #35 and keeping the main checkout on `main`). |
| R-008 | 10 | security-engineer, design-lead, supervisor | Em dashes in drafts, including inside grep patterns. The hook works; agents write them by habit. |
| R-106 | 4 | supervisor, security-engineer | Commit messages in heredocs; fixed by writing messages to a file and using `git commit -F`. |
| R-509 | 5 | supervisor, security-engineer, frontend-engineer | Token tripwires firing on text that mentioned the commands (issue bodies, probes). Working as designed. |
| R-101, R-111, R-116, R-202 | 7 | security-engineer, frontend-engineer | Hook probes by Security with synthetic roles; not real attempts. |

- Instructions that loaded: each agent read its agent file, `CLAUDE.md` and the skill or spec its delegation named. No agent read `docs/rules.md` end to end; hook messages carried the rule IDs it needed.
- Rule breaks no check caught: the Supervisor review evidence (R-207) and delegation drift (R-204). R-207 is checked by `review-gate` once #14 exists; #14 should also reject a review whose Checked lines name no command.
- Rules agents needed but did not see: the commit-message tripwire interaction (R-106 with R-509). Recorded in Security memory; the hook messages already name the fix.
- No change to `CLAUDE.md` or `.claude/` comes from this audit beyond memory files, so the probe test (#8) runs once on the final Phase 0 state.
- ADR-0018 asks to evaluate Claude Code sandbox mode with a network allowlist at the Phase 1 retro.
