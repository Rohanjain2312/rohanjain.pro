# ADR-0005: Content-driven numbers and the Evidence Ledger

Status: accepted · Date: 2026-10-15 · Issue: #4

## Context
Every number on the site must be verifiable by a hiring manager. Repos and the résumé sometimes disagree; the client resolved those conflicts in October 2026.

## Decision
No number is written in templates. Every number lives in `src/content/claims.json` with a source, seeded from the Evidence Ledger (`docs/spec/05-evidence-ledger.md`). Client-confirmed résumé values take precedence over repo values. QA verifies each claim against its source before it ships (R-303), and a CI check fails if built HTML or PDFs contain a number with no claim (R-301).

## Consequences
- Changing a number is a content change in one place, reviewed by QA.
- Unverifiable numbers are omitted and logged for the client (R-005).

## Alternatives
- Numbers inline in copy: impossible to audit.
- Repo values over résumé values: rejected by the client's decision.
