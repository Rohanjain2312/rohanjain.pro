# plan.md: rohanjain.pro build index

Version 3.0 · October 2026 · Client: Rohan Jain

**Repository:** https://github.com/Rohanjain2312/rohanjain.pro (public) · **Local folder:** `/Users/rohanjain/Desktop/Projects/rohanjain.pro` (every Claude Code session runs here) · **Domain:** `rohanjain.pro` (Porkbun)

A portfolio site whose only job is to get Rohan Jain interviews for ML Engineer, AI Engineer and Data Scientist roles. Built by a team of Claude Code agents working like an engineering organization, autonomously, phase by phase.

## What loads when
| File | Loads | Holds |
|---|---|---|
| `CLAUDE.md` | Every session and every subagent except the Reader Advocate; reloaded after compaction | Supervisor role, autonomy rules, client-only list, where things are |
| SessionStart hook | Every start, resume and compaction | The session-protocol instruction, git state, `docs/status.md`, compaction snapshot |
| `.claude/agents/<role>.md` | When that role is delegated work | Role duties, owned paths, model, review duties, veto |
| `.claude/rules/*.md` | When a matching file is read or edited | Content, fit-check, UI, tests, CI rules |
| `.claude/skills/*/SKILL.md` | Description always; body when invoked | Session protocol, reviews, phase gates, audits, validation, probes, context audit |
| `.claude/hooks/` | On every tool call (enforcement), not as context | Hard rules: blocked actions cite a rule ID |
| `docs/spec/*` | Only when read | The full specification |

## Index
| Topic | File |
|---|---|
| Every rule, its one home, how it is enforced | `docs/rules.md` |
| Product, success criteria, client decisions, budget | `docs/spec/01-product.md` |
| Team, models, RACI, independence limits | `docs/spec/02-team.md` |
| Engineering workflow | `docs/spec/03-workflow.md` |
| Requirements | `docs/spec/04-requirements.md` |
| Evidence Ledger seed (every number and source) | `docs/spec/05-evidence-ledger.md` |
| Architecture, layout, schemas, engine, ADR list | `docs/spec/06-architecture.md` |
| Design system | `docs/spec/07-design.md` |
| Security | `docs/spec/08-security.md` |
| Quality, tests, budgets | `docs/spec/09-quality.md` |
| CI/CD and checks to build | `docs/spec/10-cicd.md` |
| Phases and gates | `docs/spec/11-phases.md` |
| Runbooks, launch checklist, pre-mortem, backlog | `docs/spec/12-operations.md` |
| Source material (read-only) | `reference/README.md` |

## Live state (not in this plan)
- Tasks: GitHub Issues and the project board.
- Progress and the resume pointer: `docs/status.md`.
- Things only the client can do: `docs/needs-client.md`.

## Checks on the instructions themselves
- `node scripts/lint-docs.mjs`: one home per rule, inventory matches homes, links resolve, token budgets, no instruction files where they would be served.
- `node .claude/hooks/test-hooks.mjs`: every hook blocks and allows what it should.
- Skill `probe-test`: fresh-session probes after Phase 0 and after any change to `CLAUDE.md` or `.claude/`.

## To start or continue
First time only: if a `_claude` folder exists, run `mv _claude .claude` in the local folder (the setup files could not be written into `.claude` remotely).
In the local folder run `claude`, then type `Continue the build per plan.md.`
