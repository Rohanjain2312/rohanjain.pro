# ADR-0012: Instructions by progressive disclosure

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
Agents follow instructions best when context is small and rules are unambiguous. Prose rules are easy to forget or work around.

## Decision
`CLAUDE.md` stays small and always loaded. Each rule has exactly one home (`docs/rules.md` inventory); role files, path rules and skills load only when needed. Hard rules are enforced by hooks in `.claude/hooks/` and by CI, and blocked actions cite the rule ID. `scripts/lint-docs.mjs` checks one home per rule and token budgets (R-806); the probe test checks rules hold in fresh sessions (R-807).

## Consequences
- Rules that matter are enforced, not remembered.
- Judgment-only rules are few and audited after the fact (R-206, R-704, skill `context-audit`).

## Alternatives
- One large instruction file: costly context and rules lost in noise.
