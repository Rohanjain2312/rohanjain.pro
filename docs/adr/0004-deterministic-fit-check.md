# ADR-0004: Deterministic client-side fit check with tiered skills

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
Hiring managers paste a job posting to see whether Rohan fits. The verdict must be honest, including "Not a strong fit", and must not overstate skills that were only studied.

## Decision
A pure function `analyze(text, skills, extras, evidence)` runs in the browser. Input is normalized and capped at 8,000 characters. Matching uses patterns precompiled at build time from curated aliases; user input never becomes a RegExp. Skills have three tiers: `shipped` and `work` count as proven; `studied` and unknown market skills count as gaps. Verdict thresholds live in config and change only with an ADR, tuned against the golden set. Full spec: `docs/spec/06-architecture.md` §5.4.

## Consequences
- Same input always gives the same output, so golden, property and mutation tests are possible (R-401, R-702).
- ReDoS risk is designed out (R-402) and tested.
- Quality depends on alias curation, which is audited (R-406).

## Alternatives
- LLM scoring: ruled out by ADR-0003.
- Embedding similarity: opaque, needs a model at runtime or large precomputed data, hard to explain gaps.
