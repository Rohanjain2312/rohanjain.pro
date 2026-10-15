# ADR-0014: Pause the ruleset's signed-commit rule until the signing key is uploaded

Status: accepted (temporary, restore in #33) · Date: 2026-10-15 · Issue: #4

## Context
The `main protection` ruleset had `required_signatures`. GitHub applies it to every commit in a PR, not only to the squash commit it creates. Branch commits are signed locally with SSH but show "unknown key" until the key is uploaded to GitHub, which needs the `admin:ssh_signing_key` scope. Only the client can grant that scope (`docs/needs-client.md`). PR #2 was blocked with "base branch policy prohibits the merge".

## Decision
Remove `required_signatures` from the ruleset until the key is uploaded, then add it back (#33). All other rules stay: no deletion, no force push, linear history, PR required, squash only, no bypass.

## Consequences
- R-107 (commits on `main` are signed) still holds: every commit on `main` is a squash merge that GitHub signs (`web-flow`, verified on 9a325a0). The Supervisor checks this at each phase gate until #33 closes.
- For a short period the ruleset does not reject an unsigned push to `main`. Pushes to `main` are already blocked by the ruleset's PR requirement and by the guard-bash hook (R-101).

## Alternatives
- Wait for the client: blocks all work, contrary to R-003.
- Keep the rule and re-sign branch commits: impossible until the key is uploaded.
