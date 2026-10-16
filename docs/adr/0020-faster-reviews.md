# ADR-0020: Faster reviews: sonnet reviewers, parallel review order

Status: accepted · Date: 2026-10-16 · Issues: #115

## Context
Phase 1 used most of the client's Claude Code usage on reviews. Opus reviewers cost the most, one usage-limit stop came with six reviewers running at once, and reviews ran one after another. The client asked (2026-10-16) for sonnet reviewers, parallel reviews and fewer review rounds.

## Decision
1. Every agent file uses `model: sonnet`. The Supervisor passes `model: opus` only to a Security review of a PR that changes `.claude/hooks/`. Haiku is used for chores.
2. R-205: CI first; then QA, Security and Design Lead in parallel, at most two agents at a time; then Reader Advocate; Supervisor last. Reviewers still post before reading others' reviews, so independence is unchanged.
3. Low findings become follow-up issues instead of another review round.

## Consequences
- Reviewer model diversity is lower: builders and reviewers share one model. The seeded-defect audits (R-704) and the review audit (R-206) measure whether reviews still catch defects.
- Wall time per PR drops; reviewers may see a fix pushed by another reviewer's builder round, which R-208 already handles (a new head invalidates approvals).

## Alternatives
- Keep opus reviewers and run fewer issues per session: slower, and the client named usage as the constraint.
