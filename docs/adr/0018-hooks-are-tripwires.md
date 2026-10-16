# ADR-0018: Hooks are tripwires; input controls and token scope are the boundary

Status: accepted · Date: 2026-10-15 · Issues: #45, #60, #61

## Context
Every agent runs shell commands with the client's GitHub CLI token (scopes `repo`, `workflow`, `read:org`, `gist`), which reaches all of the client's repositories. Untrusted text (issues, comments, fetched pages, `reference/`) can reach agent context. `guard-bash.mjs` blocks known commands, but a command denylist cannot stop a determined agent: interpreters (`node -e`, `python3 -c`) and other indirection can still run anything (Security review of PR #53, 53-L1).

## Decision
1. **The input side is the primary control.** The repo's interaction limit is `collaborators_only` (expires 2027-04-16), fork PR workflows need approval for every outside contributor, and agents act only on issues, PRs and comments by `Rohanjain2312` (skills `session-protocol`, `run-review`). The Supervisor renews the interaction limit at every phase gate (skill `phase-gate`).
2. **Hooks are tripwires.** They catch common and accidental forms: token printing, credential helpers, other-repo writes, remote overrides, review and label spoofing. They match the raw command text for these, so substitution and wrappers do not hide them. They are not claimed to stop a compromised agent.
3. **Residual risk is accepted and shown to the client.** An agent steered by injected text could still use interpreter indirection to reach the token. The mitigation available to the client is a fine-grained token scoped to this repository only; it is listed as an optional step in `docs/needs-client.md`. Claude Code sandbox mode with a network allowlist is evaluated at the Phase 1 retro.

## Consequences
- Medium findings #60 and #61 close with the tripwire fixes plus this acceptance.
- New bypass forms found later are Low unless they bypass an input-side control.
- If the interaction limit lapses, the gate fails until it is renewed.

## Alternatives
- Keep extending the denylist until it is complete: not achievable.
- Require the repo-scoped token now: it is outside the client-only list, so it stays optional.
