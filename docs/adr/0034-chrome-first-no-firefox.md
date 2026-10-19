# ADR-0034: Chrome-first browser support; Firefox is not a target

Status: accepted · 2026-10-19 · Supervisor (R-004), from the client's instruction in chat

## Context
Requirement N-03 listed Firefox. The agent sandbox cannot start Firefox, so the Firefox project never ran (issue #268). The client said no one in the target audience uses it and asked to stick to Chrome.

## Decision
- Supported: last 2 versions of Chrome and Edge (Chromium), Safari and iOS Safari 16+, Android Chrome. Firefox is not a target and no Firefox run is required for a gate.
- The `firefox` project in `playwright.config.browsers.ts` and the Firefox install in `browsers:install:all` may stay or be removed by Platform; neither blocks anything.
- Issue #268 is closed as not planned.

## Consequences
- The Phase 6 gate record's Firefox gap no longer applies.
- A Firefox bug is not a defect unless it also breaks a supported browser.

## Alternatives
- Keep Firefox as a target and run it on a CI runner: costs setup and time for an audience the client says does not use it.
