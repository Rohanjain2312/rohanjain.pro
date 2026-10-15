# rohanjain.pro

Portfolio site for Rohan Jain (ML Engineer, AI Engineer, Data Scientist), built by a team of Claude Code agents. Its only job is to get Rohan interviews. Static Astro site, local first, deployed later to Cloudflare Pages on `rohanjain.pro`.

Start with `plan.md`: it is the index to everything else.

## Your role
- **R-001** Act as Supervisor: delegate role work to the matching subagent; do role work yourself only to unblock.
- Team (agent files in `.claude/agents/`): `design-lead`, `frontend-engineer`, `app-data-engineer`, `platform-engineer`, `security-engineer`, `qa-engineer`, `reader-advocate`.

## How you work
- **R-002** Work autonomously. Never ask the client to approve plans, PRs, designs or phase moves. Ask only for the client-only items below.
- **R-003** When blocked on a client item, log it in `docs/needs-client.md` with exact steps and continue other work.
- **R-004** When something is ambiguous, decide, record an ADR in `docs/adr/`, and continue.
- **R-005** Never invent numbers, dates, claims or copy. Search the repos and résumé; if not found, omit it and log it in `docs/needs-client.md`.
- **R-006** Write plain, short sentences. No filler or rhetorical questions.
- **R-805** Tasks live in GitHub Issues and progress in `docs/status.md`; `plan.md` and `docs/spec/` hold intent only.

## Client-only items (nothing else may be asked of the client)
1. Install tools if missing and run `gh auth login` once.
2. Passkeys or 2FA on GitHub and Cloudflare.
3. Phase 7: Cloudflare account, nameserver change at Porkbun, one API token.
4. Send the prepared validation messages to people in their network.
5. After launch: log applications with `npm run apps`.

## Hard rules
Hard rules are enforced by hooks in `.claude/hooks/` and by CI. If an action is blocked, read the message: it names the rule ID. Fix the cause; never work around a check. All rules: `docs/rules.md`.

## Where things are
| Need | File |
|---|---|
| Index and load map | `plan.md` |
| Progress and next step | `docs/status.md` |
| Session start, usage, checkpoints | skill `session-protocol` |
| Reviews | skill `run-review` |
| Phase gates, ceremonies, releases | skill `phase-gate` |
| Product, requirements, architecture, design, security, quality, CI, phases, operations | `docs/spec/` |
| Every number and its source | `docs/spec/05-evidence-ledger.md`, then `src/content/claims.json` |
