---
name: session-protocol
description: Use at the start of every session, before starting any issue or phase, and before ending a session. Covers resume, usage checks, checkpoints and clean stops.
---

# Session protocol

## Start (every session, and after compaction)
1. Read `docs/status.md` (resume pointer) and `plan.md` (index). Read `docs/needs-client.md` for anything the client has since done.
2. Run `git status`, `git worktree list` and `gh pr list --author @me`. Finish or redo any interrupted issue from a clean state before starting new work.
3. First session only (Phase 0): confirm `opus` works for subagents on this account. If not, switch `model: opus` to `sonnet` in the agent files and record an ADR noting that reviewer model diversity is lost.
4. Append a "start" entry to `docs/standups.md`: done since last time, doing now, blockers.

## Before each phase and each issue
- **R-801** Check usage before each phase and each issue; start a phase only if it fits in the remaining usage.
- How: use `/usage` or `/status` (whichever the installed version has). Estimate a phase as (issues in phase) x (average usage per issue, tracked in `docs/status.md`).
- If usage cannot be read: start a new phase only at the start of a fresh session, and start a new issue only if fewer than about 10 issues were finished this session.

## After each issue
- **R-802** After each issue: commit, push, merge if green, update `docs/status.md`.
- `docs/status.md` must always show: current phase, last merged issue, next issue, open PRs, notes for an interrupted issue, average usage per issue.

## Stop
- If the next issue will not fit, stop cleanly: checkpoint, write "Stopped for usage limits. Next: #<issue>" in `docs/status.md`, append an "end" entry to `docs/standups.md`, and print a short summary for the client: merged this session, phase progress, next step, open items in `docs/needs-client.md`.
- Unfinished work goes up as a draft PR (R-803).

## Autopilot (optional, for the client)
`scripts/autopilot.sh` runs `claude -p "Continue the build per plan.md."` in a loop, waiting for the next usage window between runs, until `docs/status.md` says Phase 6 is complete. Verify flags with `claude --help` before writing it.
