# ADR-0022: More parallel agents, haiku for chores, and Low findings deferred to their trigger

Status: accepted · Date: 2026-10-16 · Issues: #118 · Supersedes: ADR-0020 decision 2 (the two-agent cap)

## Context
The client said (2026-10-16, third Phase 1 session) that the build takes too long. They asked for more agents in parallel and smaller models for less intensive tasks. ADR-0020 capped work at two agents at a time.

The Phase 1 milestone also holds 18 Low follow-ups. Most name their own trigger: "before the first page with section links", "before Phase 3", "with Phase 4". Holding the Phase 1 gate for them delays Phase 2 and does not reduce risk sooner.

## Decision
1. The Supervisor runs independent issues and reviews in parallel, up to eight agents at a time. Work on overlapping files stays serialized.
2. Models: sonnet for building and for reviews of code, workflows, hooks and content; haiku for mechanical work (label chores, small docs fixes, simple Low follow-ups, docs-only reviews). No opus subagents, including Security reviews of `.claude/hooks/` changes. This replaces the opus exception in ADR-0020 decision 1.
3. R-205 keeps its order: CI first; QA, Security and Design Lead in parallel; then Reader Advocate; Supervisor last.
4. At a phase gate, a `severity:low` issue whose own text names a later trigger, or that needs something only the client can provide, moves to the milestone of that trigger. The Supervisor comments the reason on the issue and lists the moved issues in the gate record. Medium and higher findings still block (R-511).

## Consequences
- Wall time per phase drops. Peak usage per hour rises; total usage per issue stays about the same.
- Haiku reviews are weaker. Haiku never gives the only required review on a PR that changes code, workflows, hooks or content.
- No opus means no model diversity for hook reviews. The seeded-defect audits (R-704) and the review audit (R-206) measure the effect; a role below 75% gets retrained per the Phase 1 gate.
- Deferred Lows stay visible on the next milestone, and the next gate checks them again.

## Alternatives
- Keep the two-agent cap: rejected; the client named speed as the problem.
- Close every Low before each gate: slower, and most Lows are tied to work that does not exist yet.
