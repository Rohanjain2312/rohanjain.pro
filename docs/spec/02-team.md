# Team

Who does what, how independent the reviewers really are, and the RACI. Roles were chosen by the failures they catch (see the pre-mortem in `docs/spec/12-operations.md`).

## Roles at a glance
| Role | Agent file | Model | Veto |
|---|---|---|---|
| Supervisor | main session (`CLAUDE.md`) | session model | none over others' vetoes |
| Design Lead | `.claude/agents/design-lead.md` | sonnet (ADR-0020, ADR-0022) | visible PRs failing R-602 |
| Frontend Engineer | `.claude/agents/frontend-engineer.md` | sonnet | none |
| App/Data Engineer | `.claude/agents/app-data-engineer.md` | sonnet | none |
| Platform Engineer | `.claude/agents/platform-engineer.md` | sonnet | none (red CI already blocks) |
| Security Engineer | `.claude/agents/security-engineer.md` | sonnet (ADR-0020, ADR-0022) | open Medium+ finding (R-511) |
| QA Engineer | `.claude/agents/qa-engineer.md` | sonnet (ADR-0020, ADR-0022) | failing acceptance tests, mutation below threshold, unverified claims |
| Reader Advocate | `.claude/agents/reader-advocate.md` | sonnet, no CLAUDE.md, output-only access | hero, results, selected work, contact on a failed 5-second test |

Duties, owned paths, branch prefixes and handback formats live in each agent file. Owned paths are enforced from `.claude/hooks/owners.json` (R-112).

## RACI
R = responsible, A = accountable, C = consulted, I = informed.

| Area | Supervisor | Design Lead | Frontend (Frontend) | App/Data (App/Data) | Platform (Platform) | Security | QA | Reader |
|---|---|---|---|---|---|---|---|---|
| Scope, plan, ADRs | A/R | C | C | C | C | C | C | C |
| Visual direction and design spec | A | R | C | I | I | I | I | C |
| UI implementation | A | C (sign-off) | R | C | I | C | C | C |
| Accessibility | A | C | R | C | C | I | C (tests) | C |
| Content model and claims | A | I | C | R | I | C | C (verifies) | C |
| Fit-check engine and golden tests | A | I | C | R | I | C | R (rubric, mutation, property) | C |
| `/for` generator and résumé PDFs | A | C | C | R | C | C | C | C |
| CI/CD, repo, hosting prep | A | I | I | C | R | C | C | I |
| Security headers and CSP | I | I | C | C | R | A | I | I |
| Threat model and reviews | I | I | C | C | C | A/R | C | I |
| Phase gates and merges | A/R | C (design veto) | C | C | C | C (security veto) | C (QA veto) | C (reader veto) |
| External validation (skill `external-validation`) | A | I | I | C | C | C | C | R |

## Independence: what Claude Code allows and what it cannot do
**What Claude Code allows (verified against the subagent docs, October 2026; re-check at Phase 0):**
- Each subagent has its own context window and does not see the main conversation. It gets its agent-file prompt, the delegation message, `CLAUDE.md` (unless `omitClaudeMd: true`) and a git status snapshot.
- `tools` and `disallowedTools` restrict whole tools. `Bash` cannot be narrowed by pattern in an agent file; command-level limits need a `PreToolUse` hook in the agent's `hooks` field or `permissions.deny` in settings.
- `model` per agent: `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit`. The environment variable `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` would override this and must stay unset.
- `isolation: worktree` gives a temporary worktree branched from the default branch. Also available: `effort`, `maxTurns`, `memory` (`project` gives persistent per-agent memory), `background`.
- Subagents can spawn subagents up to three levels by default. Set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` so only the Supervisor delegates.

**What that independence cannot do:** every agent is a Claude model and acts through the same GitHub account. A different model tier reduces shared blind spots but does not remove them. Real independence comes from three places: context separation, machine checks that are not models, and real people (skill `external-validation`).

**Review rules** are R-201 to R-210 in `docs/rules.md` and the `run-review` skill.
