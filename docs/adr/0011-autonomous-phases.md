# ADR-0011: Autonomous phase progression with usage-aware session control

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
The client does not want to approve plans, PRs or phase moves. Sessions are limited by plan usage, and work can be interrupted at any point.

## Decision
The Supervisor moves through phases on automated gates (skill `phase-gate`) without client sign-off. Usage is checked before each phase and issue (R-801). After each issue the work is committed, pushed, merged if green and recorded in `docs/status.md` (R-802). If the next issue will not fit, the session stops cleanly with a resume pointer, and unfinished work goes up as a draft PR (R-803). The client is asked only for the client-only items in `CLAUDE.md`.

## Consequences
- Progress continues across sessions from `docs/status.md`.
- Quality rests on automated gates and independent reviewer roles rather than client review.

## Alternatives
- Client approval at each gate: slower, contradicts the client's request.
